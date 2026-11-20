using System.Globalization;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/payments/paypal")]
public class PayPalPaymentsController(AppDbContext db, IHttpClientFactory clients, IConfiguration config) : ControllerBase
{
    private const string BaseUrl = "https://api-m.sandbox.paypal.com";

    private decimal Rate => config.GetValue<decimal>("PayPalSandbox:VndPerUsd");
    private string? ClientId => config["PayPalSandbox:ClientId"];
    private string? ClientSecret => config["PayPalSandbox:ClientSecret"];
    private string? FrontendUrl => config["PayPalSandbox:FrontendUrl"];

    public static bool IsConfigured(IConfiguration config) =>
        config.GetValue<bool>("PayPalSandbox:Enabled")
        && config.GetValue<decimal>("PayPalSandbox:VndPerUsd") > 0
        && !string.IsNullOrWhiteSpace(config["PayPalSandbox:ClientId"])
        && !string.IsNullOrWhiteSpace(config["PayPalSandbox:ClientSecret"])
        && Uri.TryCreate(config["PayPalSandbox:FrontendUrl"], UriKind.Absolute, out var url)
        && url.Scheme is "https" or "http";

    [HttpGet("options")]
    public IActionResult Options()
    {
        var enabled = IsConfigured(config);
        return Ok(new { enabled, vndPerUsd = enabled ? Rate : (decimal?)null });
    }

    [Authorize]
    [HttpPost("{id:int}/order")]
    public async Task<IActionResult> CreateOrder(int id, CancellationToken ct)
    {
        if (!IsConfigured(config)) return StatusCode(503, new { message = "PayPal Sandbox is unavailable." });
        var booking = await FindBooking(id, ct);
        if (booking == null) return NotFound(new { message = "PayPal booking not found." });
        if (booking.BookingStatus == "Cancelled" || booking.PaymentStatus == "Paid")
            return Conflict(new { message = "This booking is not available for payment." });

        var amount = booking.PayPalAmountUsd ?? Math.Round(booking.TotalAmount / Rate, 2, MidpointRounding.AwayFromZero);
        if (amount <= 0) return BadRequest(new { message = "This booking has no payable balance." });

        try
        {
            var client = await CreateClient(ct);
            JsonElement order;
            if (booking.PayPalOrderId is string existing)
            {
                order = await Send(client, HttpMethod.Get, "/v2/checkout/orders/" + Uri.EscapeDataString(existing), null, null, ct);
            }
            else
            {
                var returnUrl = FrontendUrl!.TrimEnd('/') + "/tours/payment-return?bookingId=" + id;
                var payload = new
                {
                    intent = "CAPTURE",
                    purchase_units = new[] { new
                    {
                        reference_id = booking.BookingCode,
                        amount = new { currency_code = "USD", value = amount.ToString("F2", CultureInfo.InvariantCulture) }
                    } },
                    payment_source = new { paypal = new { experience_context = new
                    {
                        shipping_preference = "NO_SHIPPING",
                        user_action = "PAY_NOW",
                        return_url = returnUrl,
                        cancel_url = returnUrl + "&cancelled=1"
                    } } }
                };
                order = await Send(client, HttpMethod.Post, "/v2/checkout/orders", payload, "kanel-create-" + booking.BookingCode, ct);
                booking.PayPalOrderId = order.GetProperty("id").GetString();
                booking.PayPalAmountUsd = amount;
                await db.SaveChangesAsync(ct);
            }

            var status = order.GetProperty("status").GetString();
            if (status is "APPROVED" or "COMPLETED")
                return Ok(new { resume = true, amountUsd = amount });

            var href = order.GetProperty("links").EnumerateArray()
                .Where(link => link.GetProperty("rel").GetString() is "payer-action" or "approve")
                .Select(link => link.GetProperty("href").GetString()).FirstOrDefault();
            if (!Uri.TryCreate(href, UriKind.Absolute, out var url) || url.Scheme != "https" || url.Host != "www.sandbox.paypal.com")
                return StatusCode(502, new { message = "PayPal did not return a sandbox approval link." });

            return Ok(new { approvalUrl = url.AbsoluteUri, amountUsd = amount });
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException or KeyNotFoundException or InvalidOperationException)
        {
            return StatusCode(502, new { message = "PayPal Sandbox could not create the payment. Try again." });
        }
    }

    [Authorize]
    [HttpPost("{id:int}/capture")]
    public async Task<IActionResult> Capture(int id, CancellationToken ct)
    {
        if (!IsConfigured(config)) return StatusCode(503, new { message = "PayPal Sandbox is unavailable." });
        var booking = await FindBooking(id, ct);
        if (booking == null || booking.PayPalOrderId == null || booking.PayPalAmountUsd == null)
            return NotFound(new { message = "PayPal order not found." });
        if (booking.PaymentStatus == "Paid") return Ok(new { booking.BookingCode, booking.PaymentStatus, booking.BookingStatus, booking.PayPalAmountUsd });
        if (booking.BookingStatus == "Cancelled") return Conflict(new { message = "This booking was cancelled." });

        try
        {
            var client = await CreateClient(ct);
            var path = "/v2/checkout/orders/" + Uri.EscapeDataString(booking.PayPalOrderId);
            var order = await Send(client, HttpMethod.Get, path, null, null, ct);
            var status = order.GetProperty("status").GetString();
            if (status == "APPROVED")
                order = await Send(client, HttpMethod.Post, path + "/capture", new { }, "kanel-capture-" + booking.BookingCode, ct);
            else if (status != "COMPLETED")
                return Conflict(new { message = "The PayPal order has not been approved." });

            var units = order.GetProperty("purchase_units");
            var unit = units[0];
            if (units.GetArrayLength() != 1 || unit.GetProperty("reference_id").GetString() != booking.BookingCode)
                return StatusCode(502, new { message = "PayPal order reference could not be verified." });
            var captures = unit.GetProperty("payments").GetProperty("captures");
            var capture = captures[0];
            var paidAmount = capture.GetProperty("amount");
            if (captures.GetArrayLength() != 1 || capture.GetProperty("status").GetString() != "COMPLETED"
                || paidAmount.GetProperty("currency_code").GetString() != "USD"
                || !decimal.TryParse(paidAmount.GetProperty("value").GetString(), CultureInfo.InvariantCulture, out var paid)
                || paid != booking.PayPalAmountUsd)
                return Conflict(new { message = "PayPal has not confirmed the expected payment." });

            await using var transaction = await db.Database.BeginTransactionAsync(ct);
            var now = DateTime.UtcNow;
            var updated = await db.Bookings.Where(b => b.BookingId == id && b.PaymentStatus == "Unpaid")
                .ExecuteUpdateAsync(set => set
                    .SetProperty(b => b.PaymentStatus, "Paid")
                    .SetProperty(b => b.BookingStatus, b => b.BookingStatus == "Pending" ? "Confirmed" : b.BookingStatus)
                    .SetProperty(b => b.UpdatedAt, now), ct);
            var saved = await db.Bookings.AsNoTracking().SingleAsync(b => b.BookingId == id, ct);
            if (updated == 1 && saved.UserId is int userId)
            {
                db.Notifications.Add(new Notification
                {
                    UserId = userId,
                    Title = saved.BookingStatus == "Confirmed" ? "Booking confirmed" : "PayPal payment received",
                    Message = saved.BookingStatus == "Confirmed"
                        ? $"Payment received. Your booking {saved.BookingCode} is confirmed."
                        : $"PayPal payment received for {saved.BookingCode}. Check My Bookings for the booking status.",
                    NotificationType = "BOOKING",
                    ReferenceId = saved.BookingCode,
                    CreatedAt = now
                });
                await db.SaveChangesAsync(ct);
            }

            await transaction.CommitAsync(ct);
            return Ok(new { saved.BookingCode, saved.PaymentStatus, saved.BookingStatus, saved.PayPalAmountUsd });
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException or KeyNotFoundException or InvalidOperationException)
        {
            return StatusCode(502, new { message = "PayPal Sandbox could not verify the payment. Please retry." });
        }
    }

    private async Task<Models.Booking?> FindBooking(int id, CancellationToken ct)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return null;
        return await db.Bookings.SingleOrDefaultAsync(
            booking => booking.BookingId == id && booking.UserId == userId
                && (booking.BookingType == "Tour" || booking.BookingType == "Transport" || booking.BookingType == "Service")
                && booking.PaymentMethod == "PayPalSandbox", ct);
    }

    private async Task<HttpClient> CreateClient(CancellationToken ct)
    {
        var client = clients.CreateClient("PayPalSandbox");
        using var request = new HttpRequestMessage(HttpMethod.Post, BaseUrl + "/v1/oauth2/token");
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic",
            Convert.ToBase64String(Encoding.UTF8.GetBytes(ClientId + ":" + ClientSecret)));
        request.Content = new FormUrlEncodedContent(new Dictionary<string, string> { ["grant_type"] = "client_credentials" });
        using var response = await client.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
        var token = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.GetProperty("access_token").GetString());
        return client;
    }

    private static async Task<JsonElement> Send(HttpClient client, HttpMethod method, string path, object? payload, string? requestId, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(method, BaseUrl + path);
        if (payload != null) request.Content = JsonContent.Create(payload);
        if (requestId != null) request.Headers.Add("PayPal-Request-Id", requestId);
        request.Headers.Add("Prefer", "return=representation");
        using var response = await client.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
    }
}
