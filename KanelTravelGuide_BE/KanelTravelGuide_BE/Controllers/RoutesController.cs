using KanelTravelGuide_BE.Contracts;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/routes")]
public class RoutesController : ControllerBase
{
    private readonly AppDbContext _db;

    public RoutesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? departureLocationId, [FromQuery] int? destinationLocationId)
    {
        var query = _db.TransportRoutes
            .AsNoTracking()
            .AsQueryable();

        if (departureLocationId.HasValue)
        {
            query = query.Where(r => r.DepartureLocationId == departureLocationId.Value);
        }

        if (destinationLocationId.HasValue)
        {
            query = query.Where(r => r.DestinationLocationId == destinationLocationId.Value);
        }

        var routes = await query
            .Select(r => new
            {
                r.RouteId,
                r.DepartureLocationId,
                departureLocationName = r.DepartureLocation.LocationName,
                r.DestinationLocationId,
                destinationLocationName = r.DestinationLocation.LocationName,
                r.DistanceKm,
                r.EstimatedDuration
            })
            .ToListAsync();

        return Ok(routes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var route = await _db.TransportRoutes
            .AsNoTracking()
            .Where(r => r.RouteId == id)
            .Select(r => new
            {
                r.RouteId,
                r.DepartureLocationId,
                departureLocationName = r.DepartureLocation.LocationName,
                r.DestinationLocationId,
                destinationLocationName = r.DestinationLocation.LocationName,
                r.DistanceKm,
                r.EstimatedDuration,
                schedules = r.Schedules.Select(s => new
                {
                    s.ScheduleId,
                    s.VehicleId,
                    vehicleName = s.Vehicle.VehicleName,
                    vehicleType = s.Vehicle.VehicleType,
                    departureTime = s.DepartureTime.ToString("HH:mm:ss"),
                    s.TicketPrice,
                    s.AvailableSeats,
                    s.Status
                }).ToList()
            })
            .FirstOrDefaultAsync();

        if (route == null)
        {
            return NotFound(new { message = "Transport route not found." });
        }

        return Ok(route);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create(TransportRouteRequest request)
    {
        var depExists = await _db.Locations.AnyAsync(l => l.LocationId == request.DepartureLocationId);
        var destExists = await _db.Locations.AnyAsync(l => l.LocationId == request.DestinationLocationId);
        if (!depExists || !destExists)
        {
            return BadRequest(new { message = "Invalid departure or destination locationId." });
        }

        var route = new TransportRoute
        {
            DepartureLocationId = request.DepartureLocationId,
            DestinationLocationId = request.DestinationLocationId,
            DistanceKm = request.DistanceKm,
            EstimatedDuration = string.IsNullOrWhiteSpace(request.EstimatedDuration) ? null : request.EstimatedDuration.Trim()
        };

        _db.TransportRoutes.Add(route);
        await _db.SaveChangesAsync();

        var depName = await _db.Locations.Where(l => l.LocationId == route.DepartureLocationId).Select(l => l.LocationName).FirstOrDefaultAsync();
        var destName = await _db.Locations.Where(l => l.LocationId == route.DestinationLocationId).Select(l => l.LocationName).FirstOrDefaultAsync();

        return CreatedAtAction(nameof(GetById), new { id = route.RouteId }, new
        {
            route.RouteId,
            route.DepartureLocationId,
            departureLocationName = depName,
            route.DestinationLocationId,
            destinationLocationName = destName,
            route.DistanceKm,
            route.EstimatedDuration,
            schedules = new List<object>()
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, TransportRouteRequest request)
    {
        var route = await _db.TransportRoutes.FindAsync(id);
        if (route == null)
        {
            return NotFound(new { message = "Transport route not found." });
        }

        var depExists = await _db.Locations.AnyAsync(l => l.LocationId == request.DepartureLocationId);
        var destExists = await _db.Locations.AnyAsync(l => l.LocationId == request.DestinationLocationId);
        if (!depExists || !destExists)
        {
            return BadRequest(new { message = "Invalid departure or destination locationId." });
        }

        route.DepartureLocationId = request.DepartureLocationId;
        route.DestinationLocationId = request.DestinationLocationId;
        route.DistanceKm = request.DistanceKm;
        route.EstimatedDuration = string.IsNullOrWhiteSpace(request.EstimatedDuration) ? null : request.EstimatedDuration.Trim();

        await _db.SaveChangesAsync();

        var depName = await _db.Locations.Where(l => l.LocationId == route.DepartureLocationId).Select(l => l.LocationName).FirstOrDefaultAsync();
        var destName = await _db.Locations.Where(l => l.LocationId == route.DestinationLocationId).Select(l => l.LocationName).FirstOrDefaultAsync();

        return Ok(new
        {
            route.RouteId,
            route.DepartureLocationId,
            departureLocationName = depName,
            route.DestinationLocationId,
            destinationLocationName = destName,
            route.DistanceKm,
            route.EstimatedDuration
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var route = await _db.TransportRoutes.FindAsync(id);
        if (route == null)
        {
            return NotFound(new { message = "Transport route not found." });
        }

        _db.TransportRoutes.Remove(route);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
