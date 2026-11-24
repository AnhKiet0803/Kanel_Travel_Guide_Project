using System.ComponentModel.DataAnnotations;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
using KanelTravelGuide_BE.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/tours/{tourId:int}/departures")]
public class TourDeparturesController(AppDbContext db, IConfiguration config) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(int tourId, bool includePast = false)
    {
        if (includePast && !User.IsInRole("Admin")) return Forbid();
        var today = TourPricing.Today;
        var departures = await db.TourDepartures.AsNoTracking()
            .Where(item => item.TourId == tourId && (includePast || item.DepartureDate >= today))
            .OrderBy(item => item.DepartureDate).ThenBy(item => item.DepartureTime).ThenBy(item => item.TourDepartureId)
            .Select(item => new
            {
                item.TourDepartureId,
                item.DepartureDate,
                item.DepartureTime,
                item.ReturnDate,
                item.ReturnTime,
                item.Capacity,
                item.AdultPrice,
                Reserved = db.Bookings.Where(booking => booking.TourDepartureId == item.TourDepartureId
                    && booking.BookingStatus != "Cancelled" && booking.BookingStatus != "Hủy")
                    .Sum(booking => booking.TotalPassengers)
            }).ToListAsync();

        return Ok(departures.Select(item => new
        {
            item.TourDepartureId,
            item.DepartureDate,
            item.DepartureTime,
            item.ReturnDate,
            item.ReturnTime,
            item.Capacity,
            item.AdultPrice,
            childPrice = TourPricing.ChildPrice(item.AdultPrice, config),
            seatsLeft = Math.Max(0, item.Capacity - item.Reserved)
        }));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create(int tourId, DepartureRequest input)
    {
        if (input.DepartureDate < TourPricing.Today || input.ReturnDate < input.DepartureDate)
            return BadRequest(new { message = "Choose a future departure and a return date on or after departure." });

        if (!await db.TourPackages.AnyAsync(tour => tour.TourId == tourId))
            return NotFound(new { message = "Tour not found." });

        var item = new TourDeparture { TourId = tourId };
        if (InvalidReturnTime(input.DepartureDate, input.DepartureTime, input.ReturnDate, input.ReturnTime))
            return BadRequest(new { message = "Return time must be after departure time for a same-day tour." });
        Apply(item, input);
        db.TourDepartures.Add(item);
        await db.SaveChangesAsync();
        return StatusCode(StatusCodes.Status201Created, new { item.TourDepartureId });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int tourId, int id, DepartureRequest input)
    {
        if (input.DepartureDate == default || input.ReturnDate < input.DepartureDate)
            return BadRequest(new { message = "Select a valid departure and return date." });

        await using var transaction = await db.Database.BeginTransactionAsync();
        var item = await LockDeparture(tourId, id);
        if (item == null) return NotFound(new { message = "Departure not found." });

        var returnTime = input.ReturnTimeSpecified ? input.ReturnTime : item.ReturnTime;
        if (InvalidReturnTime(input.DepartureDate, input.DepartureTime, input.ReturnDate, returnTime))
            return BadRequest(new { message = "Return time must be after departure time for a same-day tour." });

        var bookings = db.Bookings.Where(booking => booking.TourDepartureId == id);
        var changesSchedule = input.DepartureDate != item.DepartureDate || input.ReturnDate != item.ReturnDate
            || item.DepartureTime.HasValue && input.DepartureTime != item.DepartureTime
            || item.ReturnTime.HasValue && returnTime != item.ReturnTime;
        if (changesSchedule && await bookings.AnyAsync())
            return Conflict(new { message = "Dates or a published departure time cannot change once a booking references this departure." });

        var reserved = await bookings.Where(booking => booking.BookingStatus != "Cancelled" && booking.BookingStatus != "Hủy")
            .SumAsync(booking => booking.TotalPassengers);
        if (input.Capacity < reserved)
            return Conflict(new { message = "Capacity cannot be lower than the number of reserved seats." });

        Apply(item, input);
        await db.SaveChangesAsync();
        await transaction.CommitAsync();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int tourId, int id)
    {
        await using var transaction = await db.Database.BeginTransactionAsync();
        var item = await LockDeparture(tourId, id);
        if (item == null) return NotFound(new { message = "Departure not found." });
        if (await db.Bookings.AnyAsync(booking => booking.TourDepartureId == id))
            return Conflict(new { message = "This departure has booking history and cannot be deleted." });

        db.TourDepartures.Remove(item);
        await db.SaveChangesAsync();
        await transaction.CommitAsync();
        return NoContent();
    }

    private async Task<TourDeparture?> LockDeparture(int tourId, int id)
    {
        var query = db.TourDepartures.Where(item => item.TourId == tourId && item.TourDepartureId == id);
        await query.ExecuteUpdateAsync(set => set.SetProperty(item => item.Capacity, item => item.Capacity));
        return await query.SingleOrDefaultAsync();
    }

    private static void Apply(TourDeparture item, DepartureRequest input)
    {
        item.DepartureDate = input.DepartureDate;
        item.DepartureTime = input.DepartureTime;
        item.ReturnDate = input.ReturnDate;
        if (input.ReturnTimeSpecified) item.ReturnTime = input.ReturnTime;
        item.Capacity = input.Capacity;
        item.AdultPrice = input.AdultPrice;
    }

    private static bool InvalidReturnTime(DateOnly departureDate, TimeOnly? departureTime, DateOnly returnDate, TimeOnly? returnTime)
        => departureDate == returnDate && departureTime.HasValue && returnTime.HasValue && returnTime <= departureTime;

    public class DepartureRequest
    {
        public DateOnly DepartureDate { get; set; }
        public TimeOnly? DepartureTime { get; set; }
        public DateOnly ReturnDate { get; set; }
        private TimeOnly? _returnTime;
        public TimeOnly? ReturnTime
        {
            get => _returnTime;
            set { _returnTime = value; ReturnTimeSpecified = true; }
        }
        [System.Text.Json.Serialization.JsonIgnore]
        public bool ReturnTimeSpecified { get; private set; }
        [Range(1, 10000)] public int Capacity { get; set; }
        [Range(0, 1000000000)] public decimal AdultPrice { get; set; }
    }
}
