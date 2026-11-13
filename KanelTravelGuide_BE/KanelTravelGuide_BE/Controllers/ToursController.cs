using KanelTravelGuide_BE.Contracts;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
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
    public async Task<IActionResult> GetAll([FromQuery] int? spotId, [FromQuery] bool? isFeatured, [FromQuery] string? q)
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
                t.IsFeatured
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
                t.IsFeatured
            })
            .FirstOrDefaultAsync();

        if (tour == null)
        {
            return NotFound(new { message = "Tour not found." });
        }

        return Ok(tour);
    }

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

        _db.TourPackages.Remove(tour);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
