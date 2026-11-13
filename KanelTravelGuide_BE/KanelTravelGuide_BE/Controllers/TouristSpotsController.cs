using KanelTravelGuide_BE.Contracts;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/tourist-spots")]
public class TouristSpotsController : ControllerBase
{
    private readonly AppDbContext _db;

    public TouristSpotsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? locationId, [FromQuery] int? categoryId, [FromQuery] string? q)
    {
        var query = _db.TouristSpots
            .AsNoTracking()
            .AsQueryable();

        if (locationId.HasValue)
        {
            query = query.Where(s => s.LocationId == locationId.Value);
        }

        if (categoryId.HasValue)
        {
            query = query.Where(s => s.CategoryId == categoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var keyword = q.Trim().ToLower();
            query = query.Where(s => s.SpotName.ToLower().Contains(keyword) || (s.Description != null && s.Description.ToLower().Contains(keyword)));
        }

        var items = await query
            .OrderByDescending(s => s.IsFeatured)
            .ThenByDescending(s => s.CreatedAt)
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
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var spot = await _db.TouristSpots
            .AsNoTracking()
            .Where(s => s.SpotId == id)
            .Select(s => new
            {
                s.SpotId,
                s.LocationId,
                locationName = s.Location.LocationName,
                s.CategoryId,
                categoryName = s.CategoryType.CategoryName,
                s.SpotName,
                s.ThumbnailUrl,
                s.Description,
                s.DetailedContent,
                s.IsFeatured,
                s.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (spot == null)
        {
            return NotFound(new { message = "Tourist spot not found." });
        }

        return Ok(spot);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create(TouristSpotRequest request)
    {
        var locationExists = await _db.Locations.AnyAsync(l => l.LocationId == request.LocationId);
        if (!locationExists)
        {
            return BadRequest(new { message = "Invalid locationId." });
        }

        var categoryExists = await _db.CategoryTypes.AnyAsync(c => c.CategoryId == request.CategoryId);
        if (!categoryExists)
        {
            return BadRequest(new { message = "Invalid categoryId." });
        }

        var spot = new TouristSpot
        {
            LocationId = request.LocationId,
            CategoryId = request.CategoryId,
            SpotName = request.SpotName.Trim(),
            ThumbnailUrl = string.IsNullOrWhiteSpace(request.ThumbnailUrl) ? null : request.ThumbnailUrl.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            DetailedContent = string.IsNullOrWhiteSpace(request.DetailedContent) ? null : request.DetailedContent.Trim(),
            IsFeatured = request.IsFeatured,
            CreatedAt = DateTime.UtcNow
        };

        _db.TouristSpots.Add(spot);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = spot.SpotId }, new
        {
            spot.SpotId,
            spot.LocationId,
            spot.CategoryId,
            spot.SpotName,
            spot.ThumbnailUrl,
            spot.Description,
            spot.DetailedContent,
            spot.IsFeatured,
            spot.CreatedAt
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, TouristSpotRequest request)
    {
        var spot = await _db.TouristSpots.FindAsync(id);
        if (spot == null)
        {
            return NotFound(new { message = "Tourist spot not found." });
        }

        var locationExists = await _db.Locations.AnyAsync(l => l.LocationId == request.LocationId);
        if (!locationExists)
        {
            return BadRequest(new { message = "Invalid locationId." });
        }

        var categoryExists = await _db.CategoryTypes.AnyAsync(c => c.CategoryId == request.CategoryId);
        if (!categoryExists)
        {
            return BadRequest(new { message = "Invalid categoryId." });
        }

        spot.LocationId = request.LocationId;
        spot.CategoryId = request.CategoryId;
        spot.SpotName = request.SpotName.Trim();
        spot.ThumbnailUrl = string.IsNullOrWhiteSpace(request.ThumbnailUrl) ? null : request.ThumbnailUrl.Trim();
        spot.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        spot.DetailedContent = string.IsNullOrWhiteSpace(request.DetailedContent) ? null : request.DetailedContent.Trim();
        spot.IsFeatured = request.IsFeatured;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            spot.SpotId,
            spot.LocationId,
            spot.CategoryId,
            spot.SpotName,
            spot.ThumbnailUrl,
            spot.Description,
            spot.DetailedContent,
            spot.IsFeatured,
            spot.CreatedAt
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var spot = await _db.TouristSpots.FindAsync(id);
        if (spot == null)
        {
            return NotFound(new { message = "Tourist spot not found." });
        }

        _db.TouristSpots.Remove(spot);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
