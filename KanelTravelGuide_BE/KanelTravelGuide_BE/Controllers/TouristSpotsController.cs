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

        var reviews = _db.Feedbacks.Where(f => f.IsApproved && f.Rating >= 1 && f.Rating <= 5);
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
                thumbnailUrl = s.ThumbnailImage != null ? "/api/tourist-spots/" + s.SpotId + "/thumbnail" : s.ThumbnailUrl,
                s.Description,
                s.IsFeatured,
                s.CreatedAt,
                reviewCount = reviews.Count(f => f.SpotId == s.SpotId),
                averageRating = reviews.Where(f => f.SpotId == s.SpotId).Average(f => (double?)f.Rating)
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
                thumbnailUrl = s.ThumbnailImage != null ? "/api/tourist-spots/" + s.SpotId + "/thumbnail" : s.ThumbnailUrl,
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

    [HttpGet("{id:int}/thumbnail")]
    public async Task<IActionResult> GetThumbnail(int id)
    {
        var bytes = await _db.TouristSpots
            .AsNoTracking()
            .Where(spot => spot.SpotId == id)
            .Select(spot => spot.ThumbnailImage)
            .FirstOrDefaultAsync();
        var contentType = GetImageContentType(bytes);
        return bytes != null && contentType != null ? File(bytes, contentType) : NotFound();
    }

    private static string? GetImageContentType(byte[]? bytes)
    {
        if (bytes is null) return null;
        if (bytes.Length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF)
            return "image/jpeg";
        if (bytes.AsSpan().StartsWith(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }))
            return "image/png";
        if (bytes.Length >= 12 && bytes.AsSpan(0, 4).SequenceEqual("RIFF"u8)
            && bytes.AsSpan(8, 4).SequenceEqual("WEBP"u8))
            return "image/webp";
        return null;
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create(TouristSpotRequest request)
    {
        if (request.ThumbnailImage != null && GetImageContentType(request.ThumbnailImage) == null)
        {
            return BadRequest(new { message = "Choose a valid JPG, PNG or WebP image." });
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

        var spot = new TouristSpot
        {
            LocationId = request.LocationId,
            CategoryId = request.CategoryId,
            SpotName = request.SpotName.Trim(),
            ThumbnailImage = request.ThumbnailImage,
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
            thumbnailUrl = spot.ThumbnailImage != null ? $"/api/tourist-spots/{spot.SpotId}/thumbnail" : spot.ThumbnailUrl,
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

        if (request.ThumbnailImage != null && GetImageContentType(request.ThumbnailImage) == null)
        {
            return BadRequest(new { message = "Choose a valid JPG, PNG or WebP image." });
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
        if (request.RemoveThumbnail || request.ThumbnailImage != null)
        {
            spot.ThumbnailImage = request.ThumbnailImage;
            spot.ThumbnailUrl = null;
        }
        else if (request.ThumbnailUrl != null)
        {
            spot.ThumbnailUrl = string.IsNullOrWhiteSpace(request.ThumbnailUrl) ? null : request.ThumbnailUrl.Trim();
        }
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
            thumbnailUrl = spot.ThumbnailImage != null ? $"/api/tourist-spots/{spot.SpotId}/thumbnail" : spot.ThumbnailUrl,
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

        if (await _db.Feedbacks.AnyAsync(review => review.SpotId == id))
            return Conflict(new { message = "This destination has reviews. Remove the reviews in Admin Feedback before deleting it." });

        _db.TouristSpots.Remove(spot);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
