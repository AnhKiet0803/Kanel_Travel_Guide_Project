using KanelTravelGuide_BE.Contracts;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
using KanelTravelGuide_BE.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/tours")]
public class ToursController : ControllerBase
{
    private readonly AppDbContext _db;

    public ToursController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? spotId, [FromQuery] bool? isFeatured, [FromQuery] string? q,
        [FromQuery] DateOnly? date, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate)
    {
        var query = _db.TourPackages
            .AsNoTracking()
            .AsQueryable();

        if (spotId.HasValue)
        {
            query = query.Where(t => t.SpotId == spotId.Value);
        }

        if (isFeatured.HasValue)
        {
            query = query.Where(t => t.IsFeatured == isFeatured.Value);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var keyword = q.Trim().ToLower();
            query = query.Where(t => t.TourName.ToLower().Contains(keyword) || (t.ItineraryDetail != null && t.ItineraryDetail.ToLower().Contains(keyword)));
        }

        fromDate = date ?? fromDate;
        toDate = date ?? toDate;
        if (fromDate > toDate)
        {
            return BadRequest(new { message = "The end date must be on or after the start date." });
        }

        var filterByDate = fromDate.HasValue || toDate.HasValue;
        var today = TourPricing.Today;
        var firstDate = fromDate is { } start && start > today ? start : today;
        var lastDate = toDate ?? DateOnly.MaxValue;
        var matchingDepartures = _db.TourDepartures.Where(d =>
            d.DepartureDate >= firstDate && d.DepartureDate <= lastDate &&
            d.Capacity > _db.Bookings.Where(b => b.TourDepartureId == d.TourDepartureId
                && b.BookingStatus != "Cancelled" && b.BookingStatus != "Hủy").Sum(b => b.TotalPassengers));

        if (filterByDate)
        {
            query = query.Where(t => matchingDepartures.Any(d => d.TourId == t.TourId));
        }

        var publicReviews = _db.Feedbacks.Where(review => review.IsApproved && review.Rating >= 1 && review.Rating <= 5);

        var tours = await query
            .OrderByDescending(t => t.IsFeatured)
            .ThenBy(t => t.SalePrice ?? t.StandardPrice)
            .Select(t => new
            {
                t.TourId,
                t.SpotId,
                spotName = t.TouristSpot != null ? t.TouristSpot.SpotName : null,
                t.PromotionId,
                t.TourName,
                t.Duration,
                t.StandardPrice,
                t.SalePrice,
                t.ItineraryDetail,
                t.MeetingPoint,
                t.EndPoint,
                t.TransportDescription,
                t.AccommodationDescription,
                t.GuideDescription,
                t.MealsDescription,
                t.IncludedServices,
                t.ExcludedServices,
                t.IsFeatured,
                matchingDepartureDate = filterByDate
                    ? matchingDepartures.Where(d => d.TourId == t.TourId).OrderBy(d => d.DepartureDate)
                        .Select(d => (DateOnly?)d.DepartureDate).FirstOrDefault()
                    : null,
                matchingAdultPrice = filterByDate
                    ? matchingDepartures.Where(d => d.TourId == t.TourId).Min(d => (decimal?)d.AdultPrice)
                    : null,
                reviewCount = publicReviews.Count(review => review.TourId == t.TourId),
                averageRating = publicReviews.Where(review => review.TourId == t.TourId)
                    .Average(review => (double?)review.Rating)
            })
            .ToListAsync();

        return Ok(tours);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var tour = await _db.TourPackages
            .AsNoTracking()
            .Where(t => t.TourId == id)
            .Select(t => new
            {
                t.TourId,
                t.SpotId,
                spotName = t.TouristSpot != null ? t.TouristSpot.SpotName : null,
                t.PromotionId,
                t.TourName,
                t.Duration,
                t.StandardPrice,
                t.SalePrice,
                t.ItineraryDetail,
                t.MeetingPoint,
                t.EndPoint,
                t.TransportDescription,
                t.AccommodationDescription,
                t.GuideDescription,
                t.MealsDescription,
                t.IncludedServices,
                t.ExcludedServices,
                t.IsFeatured
            })
            .FirstOrDefaultAsync();

        if (tour == null)
        {
            return NotFound(new { message = "Tour not found." });
        }

        return Ok(tour);
    }

    private static string? CleanText(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create(TourPackageRequest request)
    {
        if (request.SpotId.HasValue)
        {
            var spotExists = await _db.TouristSpots.AnyAsync(s => s.SpotId == request.SpotId.Value);
            if (!spotExists)
            {
                return BadRequest(new { message = "Invalid spotId." });
            }
        }

        if (request.PromotionId.HasValue)
        {
            var promoExists = await _db.Promotions.AnyAsync(p => p.PromotionId == request.PromotionId.Value);
            if (!promoExists)
            {
                return BadRequest(new { message = "Invalid promotionId." });
            }
        }

        var tour = new TourPackage
        {
            SpotId = request.SpotId,
            PromotionId = request.PromotionId,
            TourName = request.TourName.Trim(),
            Duration = request.Duration.Trim(),
            StandardPrice = request.StandardPrice,
            SalePrice = request.SalePrice,
            ItineraryDetail = string.IsNullOrWhiteSpace(request.ItineraryDetail) ? null : request.ItineraryDetail.Trim(),
            MeetingPoint = CleanText(request.MeetingPoint),
            EndPoint = CleanText(request.EndPoint),
            TransportDescription = CleanText(request.TransportDescription),
            AccommodationDescription = CleanText(request.AccommodationDescription),
            GuideDescription = CleanText(request.GuideDescription),
            MealsDescription = CleanText(request.MealsDescription),
            IncludedServices = CleanText(request.IncludedServices),
            ExcludedServices = CleanText(request.ExcludedServices),
            IsFeatured = request.IsFeatured
        };

        _db.TourPackages.Add(tour);
        await _db.SaveChangesAsync();

        string? spotName = null;
        if (tour.SpotId.HasValue)
        {
            spotName = await _db.TouristSpots
                .Where(s => s.SpotId == tour.SpotId.Value)
                .Select(s => s.SpotName)
                .FirstOrDefaultAsync();
        }

        return CreatedAtAction(nameof(GetById), new { id = tour.TourId }, new
        {
            tour.TourId,
            tour.SpotId,
            spotName,
            tour.PromotionId,
            tour.TourName,
            tour.Duration,
            tour.StandardPrice,
            tour.SalePrice,
            tour.ItineraryDetail,
            tour.MeetingPoint,
            tour.EndPoint,
            tour.TransportDescription,
            tour.AccommodationDescription,
            tour.GuideDescription,
            tour.MealsDescription,
            tour.IncludedServices,
            tour.ExcludedServices,
            tour.IsFeatured
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, TourPackageRequest request)
    {
        var tour = await _db.TourPackages.FindAsync(id);
        if (tour == null)
        {
            return NotFound(new { message = "Tour not found." });
        }

        if (request.SpotId.HasValue)
        {
            var spotExists = await _db.TouristSpots.AnyAsync(s => s.SpotId == request.SpotId.Value);
            if (!spotExists)
            {
                return BadRequest(new { message = "Invalid spotId." });
            }
        }

        if (request.PromotionId.HasValue)
        {
            var promoExists = await _db.Promotions.AnyAsync(p => p.PromotionId == request.PromotionId.Value);
            if (!promoExists)
            {
                return BadRequest(new { message = "Invalid promotionId." });
            }
        }

        tour.SpotId = request.SpotId;
        tour.PromotionId = request.PromotionId;
        tour.TourName = request.TourName.Trim();
        tour.Duration = request.Duration.Trim();
        tour.StandardPrice = request.StandardPrice;
        tour.SalePrice = request.SalePrice;
        tour.ItineraryDetail = string.IsNullOrWhiteSpace(request.ItineraryDetail) ? null : request.ItineraryDetail.Trim();
        if (request.MeetingPoint != null) tour.MeetingPoint = CleanText(request.MeetingPoint);
        if (request.EndPoint != null) tour.EndPoint = CleanText(request.EndPoint);
        if (request.TransportDescription != null) tour.TransportDescription = CleanText(request.TransportDescription);
        if (request.AccommodationDescription != null) tour.AccommodationDescription = CleanText(request.AccommodationDescription);
        if (request.GuideDescription != null) tour.GuideDescription = CleanText(request.GuideDescription);
        if (request.MealsDescription != null) tour.MealsDescription = CleanText(request.MealsDescription);
        if (request.IncludedServices != null) tour.IncludedServices = CleanText(request.IncludedServices);
        if (request.ExcludedServices != null) tour.ExcludedServices = CleanText(request.ExcludedServices);
        tour.IsFeatured = request.IsFeatured;

        await _db.SaveChangesAsync();

        string? spotName = null;
        if (tour.SpotId.HasValue)
        {
            spotName = await _db.TouristSpots
                .Where(s => s.SpotId == tour.SpotId.Value)
                .Select(s => s.SpotName)
                .FirstOrDefaultAsync();
        }

        return Ok(new
        {
            tour.TourId,
            tour.SpotId,
            spotName,
            tour.PromotionId,
            tour.TourName,
            tour.Duration,
            tour.StandardPrice,
            tour.SalePrice,
            tour.ItineraryDetail,
            tour.MeetingPoint,
            tour.EndPoint,
            tour.TransportDescription,
            tour.AccommodationDescription,
            tour.GuideDescription,
            tour.MealsDescription,
            tour.IncludedServices,
            tour.ExcludedServices,
            tour.IsFeatured
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var tour = await _db.TourPackages.FindAsync(id);
        if (tour == null)
        {
            return NotFound(new { message = "Tour not found." });
        }

        if (await _db.BookingDetails.AnyAsync(detail => detail.TourId == id)
            || await _db.Feedbacks.AnyAsync(feedback => feedback.TourId == id)
            || await _db.TourDepartures.AnyAsync(departure => departure.TourId == id))
        {
            return Conflict(new { message = "This tour has bookings, reviews or departures and cannot be deleted." });
        }

        _db.TourPackages.Remove(tour);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
