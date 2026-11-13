using KanelTravelGuide_BE.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/search")]
public class SearchController : ControllerBase
{
    private readonly AppDbContext _db;

    public SearchController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> BasicSearch([FromQuery] string? q)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Ok(new
            {
                spots = new List<object>(),
                tours = new List<object>(),
                services = new List<object>()
            });
        }

        var keyword = q.Trim().ToLower();

        var spots = await _db.TouristSpots
            .AsNoTracking()
            .Where(s => s.SpotName.ToLower().Contains(keyword) || (s.Description != null && s.Description.ToLower().Contains(keyword)))
            .Select(s => new
            {
                s.SpotId,
                s.SpotName,
                s.LocationId,
                locationName = s.Location.LocationName,
                s.CategoryId,
                categoryName = s.CategoryType.CategoryName,
                s.ThumbnailUrl,
                s.Description,
                s.IsFeatured
            })
            .Take(20)
            .ToListAsync();

        var tours = await _db.TourPackages
            .AsNoTracking()
            .Where(t => t.TourName.ToLower().Contains(keyword) || (t.ItineraryDetail != null && t.ItineraryDetail.ToLower().Contains(keyword)))
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
            .Take(20)
            .ToListAsync();

        var services = await _db.ServiceProviders
            .AsNoTracking()
            .Where(p => p.IsActive && (p.ProviderName.ToLower().Contains(keyword) || (p.Description != null && p.Description.ToLower().Contains(keyword)) || p.Address.ToLower().Contains(keyword)))
            .Select(p => new
            {
                p.ProviderId,
                p.ProviderName,
                p.ServiceType,
                p.LocationId,
                locationName = p.Location.LocationName,
                p.Address,
                p.Phone,
                p.StarRating,
                p.MinPrice,
                p.MaxPrice,
                p.ImageUrl
            })
            .Take(20)
            .ToListAsync();

        return Ok(new
        {
            spots,
            tours,
            services
        });
    }

    [HttpGet("advanced")]
    public async Task<IActionResult> AdvancedSearch(
        [FromQuery] int? locationId,
        [FromQuery] string? serviceType,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] int? starRating,
        [FromQuery] string? sort,
        [FromQuery] string? q)
    {
        var query = _db.ServiceProviders
            .AsNoTracking()
            .Where(p => p.IsActive)
            .AsQueryable();

        if (locationId.HasValue)
        {
            query = query.Where(p => p.LocationId == locationId.Value);
        }

        if (!string.IsNullOrWhiteSpace(serviceType))
        {
            query = query.Where(p => p.ServiceType.ToLower() == serviceType.Trim().ToLower());
        }

        if (starRating.HasValue)
        {
            query = query.Where(p => p.StarRating >= starRating.Value);
        }

        if (minPrice.HasValue)
        {
            query = query.Where(p => (p.MaxPrice ?? p.MinPrice ?? 0) >= minPrice.Value);
        }

        if (maxPrice.HasValue)
        {
            query = query.Where(p => (p.MinPrice ?? p.MaxPrice ?? 0) <= maxPrice.Value);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var keyword = q.Trim().ToLower();
            query = query.Where(p => p.ProviderName.ToLower().Contains(keyword) || (p.Description != null && p.Description.ToLower().Contains(keyword)) || p.Address.ToLower().Contains(keyword));
        }

        query = sort?.ToLower() switch
        {
            "price_asc" => query.OrderBy(p => p.MinPrice ?? p.MaxPrice ?? 0),
            "price_desc" => query.OrderByDescending(p => p.MaxPrice ?? p.MinPrice ?? 0),
            "name_asc" => query.OrderBy(p => p.ProviderName),
            _ => query.OrderByDescending(p => p.StarRating).ThenBy(p => p.MinPrice)
        };

        var results = await query
            .Select(p => new
            {
                p.ProviderId,
                p.ProviderName,
                p.ServiceType,
                p.LocationId,
                locationName = p.Location.LocationName,
                p.Address,
                p.Phone,
                p.StarRating,
                p.MinPrice,
                p.MaxPrice,
                p.ImageUrl
            })
            .ToListAsync();

        return Ok(results);
    }
}
