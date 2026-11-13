using KanelTravelGuide_BE.Contracts;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiceProvider = KanelTravelGuide_BE.Models.ServiceProvider;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/services")]
public class ServicesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ServicesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? type,
        [FromQuery] int? locationId,
        [FromQuery] int? starRating,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] string? q)
    {
        var query = _db.ServiceProviders
            .AsNoTracking()
            .Where(p => p.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(type))
        {
            query = query.Where(p => p.ServiceType.ToLower() == type.Trim().ToLower());
        }

        if (locationId.HasValue)
        {
            query = query.Where(p => p.LocationId == locationId.Value);
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
            query = query.Where(p => p.ProviderName.ToLower().Contains(keyword) || (p.Description != null && p.Description.ToLower().Contains(keyword)));
        }

        var items = await query
            .OrderByDescending(p => p.StarRating)
            .ThenBy(p => p.MinPrice)
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

        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var provider = await _db.ServiceProviders
            .AsNoTracking()
            .Where(p => p.ProviderId == id)
            .Select(p => new
            {
                p.ProviderId,
                p.ProviderName,
                p.ServiceType,
                p.LocationId,
                locationName = p.Location.LocationName,
                p.Address,
                p.Description,
                p.Phone,
                p.Website,
                p.StarRating,
                p.MinPrice,
                p.MaxPrice,
                p.ImageUrl,
                p.IsActive,
                items = p.Items.Select(i => new
                {
                    i.ItemId,
                    i.ItemName,
                    i.Capacity,
                    i.Price,
                    i.TotalQuantity,
                    i.IsAvailable
                }).ToList()
            })
            .FirstOrDefaultAsync();

        if (provider == null)
        {
            return NotFound(new { message = "Service provider not found." });
        }

        return Ok(provider);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create(ServiceProviderRequest request)
    {
        var locationExists = await _db.Locations.AnyAsync(l => l.LocationId == request.LocationId);
        if (!locationExists)
        {
            return BadRequest(new { message = "Invalid locationId." });
        }

        var provider = new ServiceProvider
        {
            LocationId = request.LocationId,
            ServiceType = request.ServiceType.Trim(),
            ProviderName = request.ProviderName.Trim(),
            StarRating = request.StarRating,
            Address = request.Address.Trim(),
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            Website = string.IsNullOrWhiteSpace(request.Website) ? null : request.Website.Trim(),
            MinPrice = request.MinPrice,
            MaxPrice = request.MaxPrice,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim(),
            IsActive = request.IsActive
        };

        _db.ServiceProviders.Add(provider);
        await _db.SaveChangesAsync();

        var locationName = await _db.Locations
            .Where(l => l.LocationId == provider.LocationId)
            .Select(l => l.LocationName)
            .FirstOrDefaultAsync();

        return CreatedAtAction(nameof(GetById), new { id = provider.ProviderId }, new
        {
            provider.ProviderId,
            provider.ProviderName,
            provider.ServiceType,
            provider.LocationId,
            locationName,
            provider.Address,
            provider.Description,
            provider.Phone,
            provider.Website,
            provider.StarRating,
            provider.MinPrice,
            provider.MaxPrice,
            provider.ImageUrl,
            provider.IsActive,
            items = new List<object>()
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, ServiceProviderRequest request)
    {
        var provider = await _db.ServiceProviders.FindAsync(id);
        if (provider == null)
        {
            return NotFound(new { message = "Service provider not found." });
        }

        var locationExists = await _db.Locations.AnyAsync(l => l.LocationId == request.LocationId);
        if (!locationExists)
        {
            return BadRequest(new { message = "Invalid locationId." });
        }

        provider.LocationId = request.LocationId;
        provider.ServiceType = request.ServiceType.Trim();
        provider.ProviderName = request.ProviderName.Trim();
        provider.StarRating = request.StarRating;
        provider.Address = request.Address.Trim();
        provider.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        provider.Website = string.IsNullOrWhiteSpace(request.Website) ? null : request.Website.Trim();
        provider.MinPrice = request.MinPrice;
        provider.MaxPrice = request.MaxPrice;
        provider.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        provider.ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim();
        provider.IsActive = request.IsActive;

        await _db.SaveChangesAsync();

        var locationName = await _db.Locations
            .Where(l => l.LocationId == provider.LocationId)
            .Select(l => l.LocationName)
            .FirstOrDefaultAsync();

        return Ok(new
        {
            provider.ProviderId,
            provider.ProviderName,
            provider.ServiceType,
            provider.LocationId,
            locationName,
            provider.Address,
            provider.Description,
            provider.Phone,
            provider.Website,
            provider.StarRating,
            provider.MinPrice,
            provider.MaxPrice,
            provider.ImageUrl,
            provider.IsActive
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var provider = await _db.ServiceProviders.FindAsync(id);
        if (provider == null)
        {
            return NotFound(new { message = "Service provider not found." });
        }

        _db.ServiceProviders.Remove(provider);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // --- Service Items (Rooms / Tables) ---

    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/items")]
    public async Task<IActionResult> CreateItem(int id, ServiceItemRequest request)
    {
        var providerExists = await _db.ServiceProviders.AnyAsync(p => p.ProviderId == id);
        if (!providerExists)
        {
            return NotFound(new { message = "Service provider not found." });
        }

        var item = new ServiceItem
        {
            ProviderId = id,
            ItemName = request.ItemName.Trim(),
            Capacity = request.Capacity,
            Price = request.Price,
            TotalQuantity = request.TotalQuantity,
            IsAvailable = request.IsAvailable
        };

        _db.ServiceItems.Add(item);
        await _db.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, new
        {
            item.ItemId,
            item.ProviderId,
            item.ItemName,
            item.Capacity,
            item.Price,
            item.TotalQuantity,
            item.IsAvailable
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{serviceId}/items/{itemId}")]
    public async Task<IActionResult> UpdateItem(int serviceId, int itemId, ServiceItemRequest request)
    {
        var item = await _db.ServiceItems.FirstOrDefaultAsync(i => i.ItemId == itemId && i.ProviderId == serviceId);
        if (item == null)
        {
            return NotFound(new { message = "Service item not found." });
        }

        item.ItemName = request.ItemName.Trim();
        item.Capacity = request.Capacity;
        item.Price = request.Price;
        item.TotalQuantity = request.TotalQuantity;
        item.IsAvailable = request.IsAvailable;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            item.ItemId,
            item.ProviderId,
            item.ItemName,
            item.Capacity,
            item.Price,
            item.TotalQuantity,
            item.IsAvailable
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{serviceId}/items/{itemId}")]
    public async Task<IActionResult> DeleteItem(int serviceId, int itemId)
    {
        var item = await _db.ServiceItems.FirstOrDefaultAsync(i => i.ItemId == itemId && i.ProviderId == serviceId);
        if (item == null)
        {
            return NotFound(new { message = "Service item not found." });
        }

        _db.ServiceItems.Remove(item);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
