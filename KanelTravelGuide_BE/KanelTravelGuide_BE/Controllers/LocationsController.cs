using KanelTravelGuide_BE.Contracts;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/locations")]
public class LocationsController : ControllerBase
{
    private readonly AppDbContext _db;

    public LocationsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var locations = await _db.Locations
            .AsNoTracking()
            .Select(l => new
            {
                l.LocationId,
                l.LocationName,
                l.Region,
                l.Description
            })
            .ToListAsync();

        return Ok(locations);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var location = await _db.Locations
            .AsNoTracking()
            .Where(l => l.LocationId == id)
            .Select(l => new
            {
                l.LocationId,
                l.LocationName,
                l.Region,
                l.Description
            })
            .FirstOrDefaultAsync();

        if (location == null)
        {
            return NotFound(new { message = "Location not found." });
        }

        return Ok(location);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create(LocationRequest request)
    {
        var location = new Location
        {
            LocationName = request.LocationName.Trim(),
            Region = request.Region.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim()
        };

        _db.Locations.Add(location);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = location.LocationId }, new
        {
            location.LocationId,
            location.LocationName,
            location.Region,
            location.Description
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, LocationRequest request)
    {
        var location = await _db.Locations.FindAsync(id);
        if (location == null)
        {
            return NotFound(new { message = "Location not found." });
        }

        location.LocationName = request.LocationName.Trim();
        location.Region = request.Region.Trim();
        location.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

        await _db.SaveChangesAsync();
        return Ok(new
        {
            location.LocationId,
            location.LocationName,
            location.Region,
            location.Description
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var location = await _db.Locations.FindAsync(id);
        if (location == null)
        {
            return NotFound(new { message = "Location not found." });
        }

        _db.Locations.Remove(location);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
