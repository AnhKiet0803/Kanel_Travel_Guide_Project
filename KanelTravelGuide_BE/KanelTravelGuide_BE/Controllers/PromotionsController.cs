using KanelTravelGuide_BE.Contracts;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/promotions")]
public class PromotionsController : ControllerBase
{
    private readonly AppDbContext _db;

    public PromotionsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? activeOnly)
    {
        var query = _db.Promotions
            .AsNoTracking()
            .AsQueryable();

        if (activeOnly.GetValueOrDefault(true))
        {
            var now = DateTime.UtcNow;
            query = query.Where(p => p.IsActive && p.StartDate <= now && p.EndDate >= now);
        }

        var items = await query
            .OrderByDescending(p => p.StartDate)
            .Select(p => new
            {
                p.PromotionId,
                p.PromoCode,
                p.Title,
                p.DiscountPercent,
                p.DiscountAmount,
                p.StartDate,
                p.EndDate,
                p.IsActive,
                TourIds = p.TourPackages.OrderBy(t => t.TourId).Select(t => t.TourId).ToList()
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var promo = await _db.Promotions
            .AsNoTracking()
            .Where(p => p.PromotionId == id)
            .Select(p => new
            {
                p.PromotionId,
                p.PromoCode,
                p.Title,
                p.DiscountPercent,
                p.DiscountAmount,
                p.StartDate,
                p.EndDate,
                p.IsActive,
                TourIds = p.TourPackages.OrderBy(t => t.TourId).Select(t => t.TourId).ToList()
            })
            .FirstOrDefaultAsync();

        if (promo == null)
        {
            return NotFound(new { message = "Promotion not found." });
        }

        return Ok(promo);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create(PromotionRequest request)
    {
        if (request.StartDate > request.EndDate)
            return BadRequest(new { message = "End date must be on or after the start date." });
        if (!string.IsNullOrWhiteSpace(request.PromoCode))
        {
            var code = request.PromoCode.Trim().ToUpperInvariant();
            if (await _db.Promotions.AnyAsync(p => p.PromoCode == code))
            {
                return Conflict(new { message = "Promo code already exists." });
            }
        }

        var promo = new Promotion
        {
            PromoCode = string.IsNullOrWhiteSpace(request.PromoCode) ? null : request.PromoCode.Trim().ToUpperInvariant(),
            Title = request.Title.Trim(),
            DiscountPercent = request.DiscountPercent,
            DiscountAmount = request.DiscountAmount,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            IsActive = request.IsActive
        };

        var linkError = await UpdateTourLinks(promo, request.TourIds);
        if (linkError != null) return linkError;

        _db.Promotions.Add(promo);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = promo.PromotionId }, new
        {
            promo.PromotionId,
            promo.PromoCode,
            promo.Title,
            promo.DiscountPercent,
            promo.DiscountAmount,
            promo.StartDate,
            promo.EndDate,
            promo.IsActive,
            TourIds = promo.TourPackages.OrderBy(t => t.TourId).Select(t => t.TourId).ToList()
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, PromotionRequest request)
    {
        if (request.StartDate > request.EndDate)
            return BadRequest(new { message = "End date must be on or after the start date." });

        var promo = await _db.Promotions.Include(p => p.TourPackages).SingleOrDefaultAsync(p => p.PromotionId == id);
        if (promo == null)
        {
            return NotFound(new { message = "Promotion not found." });
        }

        if (!string.IsNullOrWhiteSpace(request.PromoCode))
        {
            var code = request.PromoCode.Trim().ToUpperInvariant();
            if (await _db.Promotions.AnyAsync(p => p.PromoCode == code && p.PromotionId != id))
            {
                return Conflict(new { message = "Promo code already exists." });
            }
            promo.PromoCode = code;
        }
        else
        {
            promo.PromoCode = null;
        }

        promo.Title = request.Title.Trim();
        promo.DiscountPercent = request.DiscountPercent;
        promo.DiscountAmount = request.DiscountAmount;
        promo.StartDate = request.StartDate;
        promo.EndDate = request.EndDate;
        promo.IsActive = request.IsActive;

        var linkError = await UpdateTourLinks(promo, request.TourIds);
        if (linkError != null) return linkError;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            promo.PromotionId,
            promo.PromoCode,
            promo.Title,
            promo.DiscountPercent,
            promo.DiscountAmount,
            promo.StartDate,
            promo.EndDate,
            promo.IsActive,
            TourIds = promo.TourPackages.OrderBy(t => t.TourId).Select(t => t.TourId).ToList()
        });
    }

    private async Task<IActionResult?> UpdateTourLinks(Promotion promotion, List<int>? tourIds)
    {
        if (tourIds == null) return null;

        var ids = tourIds.ToHashSet();
        var tours = await _db.TourPackages.Where(t => ids.Contains(t.TourId)).ToListAsync();
        if (tours.Count != ids.Count)
            return BadRequest(new { message = "One or more selected tours no longer exist." });

        var linked = tours.FirstOrDefault(t => t.PromotionId.HasValue && t.PromotionId != promotion.PromotionId);
        if (linked != null)
            return Conflict(new { message = $"{linked.TourName} already has another promotion. Update its linked promotion in Admin Tours first." });

        foreach (var previous in promotion.TourPackages.Where(t => !ids.Contains(t.TourId)).ToList())
            previous.PromotionId = null;
        foreach (var tour in tours)
            tour.Promotion = promotion;

        return null;
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var promo = await _db.Promotions.FindAsync(id);
        if (promo == null)
        {
            return NotFound(new { message = "Promotion not found." });
        }

        if (await _db.TourPackages.AnyAsync(t => t.PromotionId == id)
            || await _db.Bookings.AnyAsync(b => b.PromotionId == id))
            return Conflict(new { message = "This promotion is linked to a tour or booking. Disable it to stop new use." });

        _db.Promotions.Remove(promo);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
