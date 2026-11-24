using System.Security.Claims;
using KanelTravelGuide_BE.Contracts;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
using KanelTravelGuide_BE.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/bookings")]
public class BookingsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public BookingsController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
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

        if (request.PaymentMethod == "PayPalSandbox")
        {
            if (!currentUserId.HasValue) return Unauthorized(new { message = "Sign in to pay with PayPal." });
            if (request.BookingType is not ("Tour" or "Transport" or "Service"))
                return BadRequest(new { message = "PayPal is unavailable for this booking type." });
            if (!PayPalPaymentsController.IsConfigured(_config))
                return StatusCode(503, new { message = "PayPal Sandbox is unavailable." });

        }

        if (request.Details.Count > 31 || request.Details.Any(detail =>
            (detail.TourId.HasValue ? 1 : 0) + (detail.ScheduleId.HasValue ? 1 : 0)
            + (detail.ServiceItemId.HasValue ? 1 : 0) != 1))
            return BadRequest(new { message = "Each booking line must contain one tour, service or transport option. Add at most 30 optional services." });

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

        var isTour = request.BookingType == "Tour";
        var isTransport = request.BookingType == "Transport";
        var isService = request.BookingType == "Service";
        if ((isTransport || isService) && (startDate < TourPricing.Today || request.Details.Count != 1
            || request.Details[0].Quantity != request.TotalPassengers
            || request.Details[0].TourId.HasValue
            || request.Details[0].ScheduleId.HasValue != isTransport
            || request.Details[0].ServiceItemId.HasValue != isService))
            return BadRequest(new { message = "Choose one available option, a valid quantity and a date from today." });

        await using var bookingTransaction = await _db.Database.BeginTransactionAsync();
        TourDeparture? departure = null;
        var adults = request.AdultCount ?? 0;
        var childAges = request.ChildAges ?? [];
        if (isTour)
        {
            if (request.TourDepartureId is not int departureId || adults < 1 || adults > 1000
                || childAges.Any(age => age < TourPricing.MinimumChildAge || age > TourPricing.MaximumChildAge) || adults + childAges.Count != request.TotalPassengers
                || request.Details[0].TourId is not int tourId
                || request.Details[0].Quantity != request.TotalPassengers
                || request.Details.Skip(1).Any(detail => detail.TourId.HasValue))
                return BadRequest(new { message = "Select a departure, at least one adult, and valid child ages (2–17)." });

            // Hold a write lock on this departure until its booking is saved.
            await _db.TourDepartures.Where(item => item.TourDepartureId == departureId)
                .ExecuteUpdateAsync(set => set.SetProperty(item => item.Capacity, item => item.Capacity));
            departure = await _db.TourDepartures.AsNoTracking()
                .SingleOrDefaultAsync(item => item.TourDepartureId == departureId && item.TourId == tourId);
            if (departure == null || departure.DepartureDate != startDate || startDate < TourPricing.Today)
                return BadRequest(new { message = "The selected departure is no longer available." });

            var reserved = await _db.Bookings.Where(b => b.TourDepartureId == departureId
                && b.BookingStatus != "Cancelled" && b.BookingStatus != "Hủy").SumAsync(b => b.TotalPassengers);
            if (request.TotalPassengers > departure.Capacity - reserved)
                return Conflict(new { message = "There are not enough seats for this departure. Choose another date." });
        }

        // Generate unique booking code: BKyyyyMMdd-XXX
        var bookingCode = await GenerateBookingCodeAsync();

        var booking = new Booking
        {
            BookingCode = bookingCode,
            TourDepartureId = departure?.TourDepartureId,
            UserId = currentUserId,
            PromotionId = appliedPromo?.PromotionId,
            CustomerName = request.CustomerName.Trim(),
            CustomerPhone = request.CustomerPhone.Trim(),
            CustomerEmail = request.CustomerEmail.Trim(),
            BookingType = request.BookingType.Trim(),
            BookingDate = DateTime.UtcNow,
            StartDate = startDate,
            TotalPassengers = request.TotalPassengers,
            PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod) ? null : request.PaymentMethod,
            PaymentStatus = "Unpaid",
            BookingStatus = "Pending",
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            UpdatedAt = null
        };

        decimal subtotal = 0;
        if (departure != null)
        {
            var childPrice = TourPricing.ChildPrice(departure.AdultPrice, _config);
            booking.Details.Add(new BookingDetail
            {
                TourId = departure.TourId, TravelerType = "Adult", Quantity = adults, UnitPrice = departure.AdultPrice
            });
            if (childAges.Count > 0)
            {
                booking.Details.Add(new BookingDetail
                {
                    TourId = departure.TourId, TravelerType = "Child", Quantity = childAges.Count, UnitPrice = childPrice
                });
            }
            subtotal = departure.AdultPrice * adults + childPrice * childAges.Count;
        }

        // Reserve additional items in a stable order inside the same transaction as the tour.
        var additionalDetails = departure == null ? request.Details : request.Details.Skip(1);
        foreach (var detailReq in additionalDetails.OrderBy(detail => detail.ScheduleId.HasValue ? 0 : 1)
            .ThenBy(detail => detail.ScheduleId ?? detail.ServiceItemId ?? detail.TourId))
        {
            decimal unitPrice = detailReq.UnitPrice ?? 0;

            if (departure != null && (detailReq.ServiceItemId.HasValue || detailReq.ScheduleId.HasValue)
                && !await _db.TourExtraOptions.AnyAsync(option => option.TourId == departure.TourId
                && option.IsEnabled && ((detailReq.ServiceItemId.HasValue && option.ServiceItemId == detailReq.ServiceItemId)
                    || (detailReq.ScheduleId.HasValue && option.ScheduleId == detailReq.ScheduleId))))
                return BadRequest(new { message = "An additional service is no longer offered for this tour. Return to the tour to update your selection." });

            if (detailReq.TourId.HasValue)
            {
                var tour = await _db.TourPackages.FindAsync(detailReq.TourId.Value);
                if (tour == null)
                {
                    return BadRequest(new { message = $"Tour with id {detailReq.TourId.Value} not found." });
                }
                if (request.PaymentMethod == "PayPalSandbox" || detailReq.UnitPrice == null || detailReq.UnitPrice <= 0)
                {
                    unitPrice = tour.SalePrice ?? tour.StandardPrice;
                }
            }
            else if (detailReq.ScheduleId is int scheduleId)
            {
                var quantity = detailReq.Quantity + booking.Details.Where(d => d.ScheduleId == scheduleId).Sum(d => d.Quantity);
                var (price, remaining) = await GetScheduleAvailability(scheduleId, startDate);
                if (price is null)
                    return BadRequest(new { message = "This schedule is no longer running." });
                if (quantity > remaining)
                    return Conflict(new { message = "There are not enough seats for the selected date." });
                unitPrice = price.Value;
            }
            else if (detailReq.ServiceItemId is int itemId)
            {
                var quantity = detailReq.Quantity + booking.Details.Where(d => d.ServiceItemId == itemId).Sum(d => d.Quantity);
                var (price, remaining) = await GetServiceAvailability(itemId, startDate);
                if (price is null)
                    return BadRequest(new { message = "This service item is no longer available." });
                if (quantity > remaining)
                    return Conflict(new { message = "There are not enough units for the selected date." });
                unitPrice = price.Value;
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

        booking.DiscountAmount = Math.Min(subtotal, discountAmount);
        booking.TotalAmount = Math.Max(0, subtotal - discountAmount);

        if (request.PaymentMethod == "PayPalSandbox" && booking.TotalAmount <= 0)
            return BadRequest(new { message = "Choose another payment method for a zero-balance booking." });

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

        await bookingTransaction.CommitAsync();

        return StatusCode(StatusCodes.Status201Created, new
        {
            booking.BookingId,
            booking.BookingCode,
            booking.BookingType,
            booking.BookingStatus,
            booking.PaymentMethod,
            booking.PaymentStatus,
            booking.TotalAmount,
            booking.BookingDate
        });
    }

    // Hold the inventory row lock until the caller commits its booking transaction.
    private async Task<(decimal? Price, int Remaining)> GetScheduleAvailability(int id, DateOnly date)
    {
        var schedules = _db.Schedules.Where(s => s.ScheduleId == id);
        await schedules.ExecuteUpdateAsync(set => set.SetProperty(s => s.Status, s => s.Status));
        var schedule = await schedules.Where(s => s.Status == "Running")
            .Select(s => new { s.TicketPrice, Seats = s.AvailableSeats ?? s.Vehicle.TotalSeats }).SingleOrDefaultAsync();
        if (schedule == null) return (null, 0);
        var reserved = await ActiveDetails(date).Where(d => d.ScheduleId == id).SumAsync(d => d.Quantity);
        return (schedule.TicketPrice, schedule.Seats - reserved);
    }

    private async Task<(decimal? Price, int Remaining)> GetServiceAvailability(int id, DateOnly date)
    {
        var items = _db.ServiceItems.Where(i => i.ItemId == id);
        await items.ExecuteUpdateAsync(set => set.SetProperty(i => i.TotalQuantity, i => i.TotalQuantity));
        var item = await items.Where(i => i.IsAvailable && i.ServiceProvider.IsActive)
            .Select(i => new { i.Price, i.TotalQuantity }).SingleOrDefaultAsync();
        if (item == null) return (null, 0);
        var reserved = await ActiveDetails(date).Where(d => d.ServiceItemId == id).SumAsync(d => d.Quantity);
        return (item.Price, item.TotalQuantity - reserved);
    }

    private IQueryable<BookingDetail> ActiveDetails(DateOnly date) => _db.BookingDetails
        .Where(d => d.Booking.StartDate == date && d.Booking.BookingStatus != "Cancelled" && d.Booking.BookingStatus != "Hủy");

    private IQueryable<Booking> WithReservedItems() => _db.Bookings.AsNoTracking()
        .Include(b => b.Details).ThenInclude(d => d.TourPackage)
        .Include(b => b.Details).ThenInclude(d => d.ServiceItem!).ThenInclude(i => i.ServiceProvider)
        .Include(b => b.Details).ThenInclude(d => d.Schedule!).ThenInclude(s => s.Vehicle)
        .Include(b => b.Details).ThenInclude(d => d.Schedule!).ThenInclude(s => s.Route).ThenInclude(r => r.DepartureLocation)
        .Include(b => b.Details).ThenInclude(d => d.Schedule!).ThenInclude(s => s.Route).ThenInclude(r => r.DestinationLocation);

    private static object ReservedItem(BookingDetail detail)
    {
        var schedule = detail.Schedule;
        var provider = detail.ServiceItem?.ServiceProvider;
        return new
        {
            detail.DetailId,
            detail.TourId,
            detail.TravelerType,
            detail.ScheduleId,
            detail.ServiceItemId,
            detail.Quantity,
            detail.UnitPrice,
            TourName = detail.TourPackage?.TourName,
            ProviderName = provider?.ProviderName,
            ServiceType = provider?.ServiceType,
            ServiceItemName = detail.ServiceItem?.ItemName,
            ScheduleInfo = schedule == null ? null : $"{schedule.Route.DepartureLocation.LocationName} → {schedule.Route.DestinationLocation.LocationName}",
            VehicleName = schedule?.Vehicle.VehicleName,
            DepartureTime = schedule?.DepartureTime.ToString("HH:mm")
        };
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

        var bookings = await WithReservedItems()
            .Where(b => b.UserId == currentUserId.Value)
            .OrderByDescending(b => b.BookingDate)
            .ToListAsync();

        return Ok(bookings.Select(b => new
            {
                b.BookingId,
                b.BookingCode,
                b.BookingType,
                b.BookingDate,
                startDate = b.StartDate.ToString("yyyy-MM-dd"),
                b.TotalPassengers,
                b.DiscountAmount,
                b.TotalAmount,
                b.PaymentMethod,
                b.PaymentStatus,
                b.BookingStatus,
                details = b.Details.OrderBy(d => d.DetailId).Select(ReservedItem)
            }));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var booking = await WithReservedItems().FirstOrDefaultAsync(b => b.BookingId == id);

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
            booking.PaymentMethod,
            booking.PaymentStatus,
            booking.BookingStatus,
            booking.Notes,
            booking.UpdatedAt,
            details = booking.Details.OrderBy(d => d.DetailId).Select(ReservedItem)
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
                b.PaymentMethod,
                b.PayPalOrderId,
                b.PayPalAmountUsd,
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

        var reopening = (booking.BookingStatus is "Cancelled" or "Hủy")
            && !string.IsNullOrWhiteSpace(request.BookingStatus)
            && request.BookingStatus.Trim() is not ("Cancelled" or "Hủy");
        await using var reopeningTransaction = reopening ? await _db.Database.BeginTransactionAsync() : null;
        if (reopening && booking.TourDepartureId is int departureId)
        {
            var departure = _db.TourDepartures.Where(item => item.TourDepartureId == departureId);
            await departure.ExecuteUpdateAsync(set => set.SetProperty(item => item.Capacity, item => item.Capacity));
            var capacity = await departure.Select(item => item.Capacity).SingleAsync();
            var reserved = await _db.Bookings.Where(item => item.TourDepartureId == departureId && item.BookingId != id
                && item.BookingStatus != "Cancelled" && item.BookingStatus != "Hủy").SumAsync(item => item.TotalPassengers);
            if (booking.TotalPassengers > capacity - reserved)
                return Conflict(new { message = "There are not enough seats to reopen this booking." });
        }

        if (reopening)
        {
            var details = await _db.BookingDetails.Where(d => d.BookingId == id)
                .Select(d => new { d.ScheduleId, d.ServiceItemId, d.Quantity }).ToListAsync();
            foreach (var group in details.Where(d => d.ScheduleId.HasValue).GroupBy(d => d.ScheduleId!.Value).OrderBy(g => g.Key))
            {
                var (_, remaining) = await GetScheduleAvailability(group.Key, booking.StartDate);
                if (group.Sum(d => d.Quantity) > remaining)
                    return Conflict(new { message = "There are not enough seats to reopen this booking." });
            }
            foreach (var group in details.Where(d => d.ServiceItemId.HasValue).GroupBy(d => d.ServiceItemId!.Value).OrderBy(g => g.Key))
            {
                var (_, remaining) = await GetServiceAvailability(group.Key, booking.StartDate);
                if (group.Sum(d => d.Quantity) > remaining)
                    return Conflict(new { message = "There are not enough units to reopen this booking." });
            }
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

        if (reopeningTransaction != null) await reopeningTransaction.CommitAsync();

        return Ok(new
        {
            booking.BookingId,
            booking.BookingCode,
            booking.BookingStatus,
            booking.PaymentMethod,
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
