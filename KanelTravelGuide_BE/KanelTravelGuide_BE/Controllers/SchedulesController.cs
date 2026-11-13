using KanelTravelGuide_BE.Contracts;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/schedules")]
public class SchedulesController : ControllerBase
{
    private readonly AppDbContext _db;

    public SchedulesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? routeId, [FromQuery] string? status)
    {
        var query = _db.Schedules
            .AsNoTracking()
            .AsQueryable();

        if (routeId.HasValue)
        {
            query = query.Where(s => s.RouteId == routeId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(s => s.Status.ToLower() == status.Trim().ToLower());
        }

        var items = await query
            .OrderBy(s => s.DepartureTime)
            .Select(s => new
            {
                s.ScheduleId,
                s.RouteId,
                departureLocationName = s.Route.DepartureLocation.LocationName,
                destinationLocationName = s.Route.DestinationLocation.LocationName,
                s.VehicleId,
                vehicleName = s.Vehicle.VehicleName,
                vehicleType = s.Vehicle.VehicleType,
                departureTime = s.DepartureTime.ToString("HH:mm:ss"),
                s.TicketPrice,
                s.AvailableSeats,
                s.Status
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var schedule = await _db.Schedules
            .AsNoTracking()
            .Where(s => s.ScheduleId == id)
            .Select(s => new
            {
                s.ScheduleId,
                s.RouteId,
                departureLocationName = s.Route.DepartureLocation.LocationName,
                destinationLocationName = s.Route.DestinationLocation.LocationName,
                s.VehicleId,
                vehicleName = s.Vehicle.VehicleName,
                vehicleType = s.Vehicle.VehicleType,
                departureTime = s.DepartureTime.ToString("HH:mm:ss"),
                s.TicketPrice,
                s.AvailableSeats,
                s.Status
            })
            .FirstOrDefaultAsync();

        if (schedule == null)
        {
            return NotFound(new { message = "Schedule not found." });
        }

        return Ok(schedule);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create(ScheduleRequest request)
    {
        var routeExists = await _db.TransportRoutes.AnyAsync(r => r.RouteId == request.RouteId);
        if (!routeExists)
        {
            return BadRequest(new { message = "Invalid routeId." });
        }

        var vehicle = await _db.Vehicles.FindAsync(request.VehicleId);
        if (vehicle == null)
        {
            return BadRequest(new { message = "Invalid vehicleId." });
        }

        if (!TimeOnly.TryParse(request.DepartureTime, out var departureTime))
        {
            return BadRequest(new { message = "Invalid departureTime format. Use HH:mm or HH:mm:ss." });
        }

        var schedule = new Schedule
        {
            RouteId = request.RouteId,
            VehicleId = request.VehicleId,
            DepartureTime = departureTime,
            TicketPrice = request.TicketPrice,
            AvailableSeats = request.AvailableSeats ?? vehicle.TotalSeats,
            Status = string.IsNullOrWhiteSpace(request.Status) ? "Running" : request.Status.Trim()
        };

        _db.Schedules.Add(schedule);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = schedule.ScheduleId }, new
        {
            schedule.ScheduleId,
            schedule.RouteId,
            schedule.VehicleId,
            vehicle.VehicleName,
            vehicle.VehicleType,
            departureTime = schedule.DepartureTime.ToString("HH:mm:ss"),
            schedule.TicketPrice,
            schedule.AvailableSeats,
            schedule.Status
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, ScheduleRequest request)
    {
        var schedule = await _db.Schedules.FindAsync(id);
        if (schedule == null)
        {
            return NotFound(new { message = "Schedule not found." });
        }

        var routeExists = await _db.TransportRoutes.AnyAsync(r => r.RouteId == request.RouteId);
        if (!routeExists)
        {
            return BadRequest(new { message = "Invalid routeId." });
        }

        var vehicle = await _db.Vehicles.FindAsync(request.VehicleId);
        if (vehicle == null)
        {
            return BadRequest(new { message = "Invalid vehicleId." });
        }

        if (!TimeOnly.TryParse(request.DepartureTime, out var departureTime))
        {
            return BadRequest(new { message = "Invalid departureTime format. Use HH:mm or HH:mm:ss." });
        }

        schedule.RouteId = request.RouteId;
        schedule.VehicleId = request.VehicleId;
        schedule.DepartureTime = departureTime;
        schedule.TicketPrice = request.TicketPrice;
        if (request.AvailableSeats.HasValue)
        {
            schedule.AvailableSeats = request.AvailableSeats.Value;
        }
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            schedule.Status = request.Status.Trim();
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            schedule.ScheduleId,
            schedule.RouteId,
            schedule.VehicleId,
            vehicle.VehicleName,
            vehicle.VehicleType,
            departureTime = schedule.DepartureTime.ToString("HH:mm:ss"),
            schedule.TicketPrice,
            schedule.AvailableSeats,
            schedule.Status
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var schedule = await _db.Schedules.FindAsync(id);
        if (schedule == null)
        {
            return NotFound(new { message = "Schedule not found." });
        }

        _db.Schedules.Remove(schedule);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
