using System.Security.Claims;
using KanelTravelGuide_BE.Contracts;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/bookings")]
public class BookingsController : ControllerBase
{
    private readonly AppDbContext _db;

    public BookingsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Create(BookingRequest request)
    {
        if (request.Details == null || request.Details.Count == 0)
        {
            return BadRequest(new { message = "At least one booking detail is required." });
        }

        if (!DateOnly.TryParse(request.StartDate, out var startDate))
        {
            return BadRequest(new { message = "Invalid startDate format. Use YYYY-MM-DD." });
        }

        int? currentUserId = GetCurrentUserId();

        // Check promo voucher code if provided
        Promotion? appliedPromo = null;
        if (!string.IsNullOrWhiteSpace(request.PromoCode))
        {
            var code = request.PromoCode.Trim().ToUpperInvariant();
            var now = DateTime.UtcNow;
            appliedPromo = await _db.Promotions
                .FirstOrDefaultAsync(p => p.PromoCode == code && p.IsActive && p.StartDate <= now && p.EndDate >= now);

            if (appliedPromo == null)
            {
                return BadRequest(new { message = "Invalid or expired promo code." });
            }
        }

        // Generate unique booking code: BKyyyyMMdd-XXX
        var bookingCode = await GenerateBookingCodeAsync();

        var booking = new Booking
        {
            BookingCode = bookingCode,
            UserId = currentUserId,
            PromotionId = appliedPromo?.PromotionId,
            CustomerName = request.CustomerName.Trim(),
            CustomerPhone = request.CustomerPhone.Trim(),
            CustomerEmail = request.CustomerEmail.Trim(),
            BookingType = request.BookingType.Trim(),
            BookingDate = DateTime.UtcNow,
            StartDate = startDate,
            TotalPassengers = request.TotalPassengers,
            PaymentStatus = "Unpaid",
            BookingStatus = "Pending",
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            UpdatedAt = null
        };

        decimal subtotal = 0;
        foreach (var detailReq in request.Details)
        {
            decimal unitPrice = detailReq.UnitPrice ?? 0;

            if (detailReq.TourId.HasValue)
            {
                var tour = await _db.TourPackages.FindAsync(detailReq.TourId.Value);
                if (tour == null)
                {
                    return BadRequest(new { message = $"Tour with id {detailReq.TourId.Value} not found." });
                }
                if (detailReq.UnitPrice == null || detailReq.UnitPrice <= 0)
                {
                    unitPrice = tour.SalePrice ?? tour.StandardPrice;
                }
            }
            else if (detailReq.ScheduleId.HasValue)
            {
                var schedule = await _db.Schedules.FindAsync(detailReq.ScheduleId.Value);
                if (schedule == null)
                {
                    return BadRequest(new { message = $"Schedule with id {detailReq.ScheduleId.Value} not found." });
                }
                if (detailReq.UnitPrice == null || detailReq.UnitPrice <= 0)
                {
                    unitPrice = schedule.TicketPrice;
                }

                // Decrement available seats if tracked
                if (schedule.AvailableSeats.HasValue)
                {
                    schedule.AvailableSeats = Math.Max(0, schedule.AvailableSeats.Value - detailReq.Quantity);
                }
            }
            else if (detailReq.ServiceItemId.HasValue)
            {
                var item = await _db.ServiceItems.FindAsync(detailReq.ServiceItemId.Value);
                if (item == null)
                {
                    return BadRequest(new { message = $"Service item with id {detailReq.ServiceItemId.Value} not found." });
                }
                if (detailReq.UnitPrice == null || detailReq.UnitPrice <= 0)
                {
                    unitPrice = item.Price;
                }
            }
            else
            {
                return BadRequest(new { message = "Each detail must specify either tourId, scheduleId, or serviceItemId." });
            }

            var detail = new BookingDetail
            {
                TourId = detailReq.TourId,
                ScheduleId = detailReq.ScheduleId,
                ServiceItemId = detailReq.ServiceItemId,
                Quantity = detailReq.Quantity,
                UnitPrice = unitPrice
            };

            booking.Details.Add(detail);
            subtotal += unitPrice * detailReq.Quantity;
        }

        // Calculate discount
        decimal discountAmount = 0;
        if (appliedPromo != null)
        {
            if (appliedPromo.DiscountPercent.HasValue && appliedPromo.DiscountPercent.Value > 0)
            {
                discountAmount = Math.Round(subtotal * (appliedPromo.DiscountPercent.Value / 100m), 2);
            }
            else if (appliedPromo.DiscountAmount.HasValue)
            {
                discountAmount = appliedPromo.DiscountAmount.Value;
            }
        }

        booking.DiscountAmount = discountAmount;
        booking.TotalAmount = Math.Max(0, subtotal - discountAmount);

        _db.Bookings.Add(booking);

        // System log
        _db.SystemLogs.Add(new SystemLog
        {
            UserId = currentUserId,
            ActionType = "INSERT",
            ActionDescription = $"Created booking {booking.BookingCode} ({booking.BookingType}) for {booking.CustomerName}.",
            CreatedAt = DateTime.UtcNow
        });

        // Notification for user if registered
        if (currentUserId.HasValue)
        {
            _db.Notifications.Add(new Notification
            {
                UserId = currentUserId.Value,
                Title = "Booking placed",
                Message = $"Booking {booking.BookingCode} has been placed successfully.",
                NotificationType = "BOOKING",
                ReferenceId = booking.BookingCode,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, new
        {
            booking.BookingId,
            booking.BookingCode,
            booking.BookingType,
            booking.BookingStatus,
            booking.PaymentStatus,
            booking.TotalAmount,
            booking.BookingDate
        });
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetUserBookings()
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Unauthorized(new { message = "Sign in is required." });
        }

        var bookings = await _db.Bookings
            .AsNoTracking()
            .Where(b => b.UserId == currentUserId.Value)
            .OrderByDescending(b => b.BookingDate)
            .Select(b => new
            {
                b.BookingId,
                b.BookingCode,
                b.BookingType,
                b.BookingDate,
                startDate = b.StartDate.ToString("yyyy-MM-dd"),
                b.TotalPassengers,
                b.DiscountAmount,
                b.TotalAmount,
                b.PaymentStatus,
                b.BookingStatus
            })
            .ToListAsync();

        return Ok(bookings);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var booking = await _db.Bookings
            .AsNoTracking()
            .Include(b => b.Details)
            .FirstOrDefaultAsync(b => b.BookingId == id);

        if (booking == null)
        {
            return NotFound(new { message = "Booking not found." });
        }

        var currentUserId = GetCurrentUserId();
        var isAdmin = User?.IsInRole("Admin") ?? false;

        // If user is authenticated and not admin, check if this booking belongs to them
        if (booking.UserId.HasValue && !isAdmin)
        {
            if (currentUserId == null || booking.UserId != currentUserId)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Access denied." });
            }
        }

        return Ok(new
        {
            booking.BookingId,
            booking.BookingCode,
            booking.UserId,
            booking.CustomerName,
            booking.CustomerPhone,
            booking.CustomerEmail,
            booking.BookingType,
            booking.BookingDate,
            startDate = booking.StartDate.ToString("yyyy-MM-dd"),
            booking.TotalPassengers,
            booking.DiscountAmount,
            booking.TotalAmount,
            booking.PaymentStatus,
            booking.BookingStatus,
            booking.Notes,
            booking.UpdatedAt,
            details = booking.Details.Select(d => new
            {
                d.DetailId,
                d.TourId,
                d.ScheduleId,
                d.ServiceItemId,
                d.Quantity,
                d.UnitPrice
            }).ToList()
        });
    }

    [Authorize]
    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> Cancel(int id, [FromBody] BookingCancelRequest? request)
    {
        var booking = await _db.Bookings.FindAsync(id);
        if (booking == null)
        {
            return NotFound(new { message = "Booking not found." });
        }

        var currentUserId = GetCurrentUserId();
        var isAdmin = User?.IsInRole("Admin") ?? false;

        if (!isAdmin && booking.UserId != currentUserId)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Access denied." });
        }

        if (booking.BookingStatus == "Cancelled" || booking.BookingStatus == "Hủy")
        {
            return BadRequest(new { message = "Booking is already cancelled." });
        }

        if (booking.BookingStatus == "Completed" || booking.BookingStatus == "Hoàn tất")
        {
            return BadRequest(new { message = "Completed booking cannot be cancelled." });
        }

        booking.BookingStatus = "Cancelled";
        booking.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request?.Reason))
        {
            booking.Notes = string.IsNullOrWhiteSpace(booking.Notes)
                ? $"Cancel reason: {request.Reason.Trim()}"
                : $"{booking.Notes} | Cancel reason: {request.Reason.Trim()}";
        }

        _db.SystemLogs.Add(new SystemLog
        {
            UserId = currentUserId,
            ActionType = "UPDATE",
            ActionDescription = $"Booking {booking.BookingCode} cancelled.",
            CreatedAt = DateTime.UtcNow
        });

        if (booking.UserId.HasValue)
        {
            _db.Notifications.Add(new Notification
            {
                UserId = booking.UserId.Value,
                Title = "Booking cancelled",
                Message = $"Booking {booking.BookingCode} has been cancelled.",
                NotificationType = "BOOKING",
                ReferenceId = booking.BookingCode,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            booking.BookingId,
            booking.BookingCode,
            booking.BookingStatus,
            booking.UpdatedAt
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("manage")]
    public async Task<IActionResult> Manage([FromQuery] string? bookingStatus, [FromQuery] string? paymentStatus, [FromQuery] string? q)
    {
        var query = _db.Bookings
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(bookingStatus))
        {
            query = query.Where(b => b.BookingStatus.ToLower() == bookingStatus.Trim().ToLower());
        }

        if (!string.IsNullOrWhiteSpace(paymentStatus))
        {
            query = query.Where(b => b.PaymentStatus.ToLower() == paymentStatus.Trim().ToLower());
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var keyword = q.Trim().ToLower();
            query = query.Where(b => b.BookingCode.ToLower().Contains(keyword) || b.CustomerName.ToLower().Contains(keyword) || b.CustomerPhone.Contains(keyword) || b.CustomerEmail.ToLower().Contains(keyword));
        }

        var items = await query
            .OrderByDescending(b => b.BookingDate)
            .Select(b => new
            {
                b.BookingId,
                b.BookingCode,
                b.UserId,
                b.CustomerName,
                b.CustomerPhone,
                b.CustomerEmail,
                b.BookingType,
                b.BookingDate,
                startDate = b.StartDate.ToString("yyyy-MM-dd"),
                b.TotalPassengers,
                b.DiscountAmount,
                b.TotalAmount,
                b.PaymentStatus,
                b.BookingStatus
            })
            .ToListAsync();

        return Ok(items);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, BookingStatusUpdateRequest request)
    {
        var booking = await _db.Bookings.FindAsync(id);
        if (booking == null)
        {
            return NotFound(new { message = "Booking not found." });
        }

        if (!string.IsNullOrWhiteSpace(request.BookingStatus))
        {
            booking.BookingStatus = request.BookingStatus.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.PaymentStatus))
        {
            booking.PaymentStatus = request.PaymentStatus.Trim();
        }

        booking.UpdatedAt = DateTime.UtcNow;

        var currentUserId = GetCurrentUserId();
        _db.SystemLogs.Add(new SystemLog
        {
            UserId = currentUserId,
            ActionType = "UPDATE",
            ActionDescription = $"Admin updated booking {booking.BookingCode} status to {booking.BookingStatus}, payment to {booking.PaymentStatus}.",
            CreatedAt = DateTime.UtcNow
        });

        if (booking.UserId.HasValue)
        {
            _db.Notifications.Add(new Notification
            {
                UserId = booking.UserId.Value,
                Title = $"Booking {booking.BookingStatus}",
                Message = $"Booking {booking.BookingCode} status is now {booking.BookingStatus} (Payment: {booking.PaymentStatus}).",
                NotificationType = "BOOKING",
                ReferenceId = booking.BookingCode,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            booking.BookingId,
            booking.BookingCode,
            booking.BookingStatus,
            booking.PaymentStatus,
            booking.UpdatedAt
        });
    }

    private int? GetCurrentUserId()
    {
        var idStr = User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(idStr, out var id))
        {
            return id;
        }
        return null;
    }

    private async Task<string> GenerateBookingCodeAsync()
    {
        var prefix = $"BK{DateTime.UtcNow:yyyyMMdd}";
        for (int i = 1; i <= 999; i++)
        {
            var code = $"{prefix}-{i:D3}";
            if (!await _db.Bookings.AnyAsync(b => b.BookingCode == code))
            {
                return code;
            }
        }
        return $"{prefix}-{Guid.NewGuid().ToString("N")[..4].ToUpperInvariant()}";
    }
}
