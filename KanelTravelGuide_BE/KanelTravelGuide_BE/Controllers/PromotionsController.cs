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
                p.IsActive
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
                p.IsActive
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
            promo.IsActive
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, PromotionRequest request)
    {
        var promo = await _db.Promotions.FindAsync(id);
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
            promo.IsActive
        });
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

        _db.Promotions.Remove(promo);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
