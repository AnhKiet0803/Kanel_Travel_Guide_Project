using KanelTravelGuide_BE.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/home")]
public class HomeController : ControllerBase
{
    private readonly AppDbContext _db;

    public HomeController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetHomeData()
    {
        var spots = await _db.TouristSpots
            .AsNoTracking()
            .Where(s => s.IsFeatured)
            .Select(s => new
            {
                s.SpotId,
                s.SpotName,
                locationName = s.Location.LocationName,
                categoryName = s.CategoryType.CategoryName,
                s.ThumbnailUrl,
                s.IsFeatured
            })
            .ToListAsync();

        var tours = await _db.TourPackages
            .AsNoTracking()
            .Where(t => t.IsFeatured)
            .Select(t => new
            {
                t.TourId,
                t.TourName,
                t.Duration,
                t.StandardPrice,
                t.SalePrice,
                t.IsFeatured
            })
            .ToListAsync();

        var promotions = await _db.Promotions
            .AsNoTracking()
            .Where(p => p.IsActive)
            .Select(p => new
            {
                p.PromotionId,
                p.Title,
                p.PromoCode,
                p.DiscountPercent,
                p.DiscountAmount
            })
            .ToListAsync();

        return Ok(new
        {
            spots,
            tours,
            promotions
        });
    }
}
