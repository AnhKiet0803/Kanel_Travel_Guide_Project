using KanelTravelGuide_BE.Contracts;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/vehicles")]
public class VehiclesController : ControllerBase
{
    private readonly AppDbContext _db;

    public VehiclesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var vehicles = await _db.Vehicles
            .AsNoTracking()
            .Select(v => new
            {
                v.VehicleId,
                v.VehicleName,
                v.VehicleType,
                v.TotalSeats
            })
            .ToListAsync();

        return Ok(vehicles);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var vehicle = await _db.Vehicles
            .AsNoTracking()
            .Where(v => v.VehicleId == id)
            .Select(v => new
            {
                v.VehicleId,
                v.VehicleName,
                v.VehicleType,
                v.TotalSeats
            })
            .FirstOrDefaultAsync();

        if (vehicle == null)
        {
            return NotFound(new { message = "Vehicle not found." });
        }

        return Ok(vehicle);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create(VehicleRequest request)
    {
        var vehicle = new Vehicle
        {
            VehicleName = request.VehicleName.Trim(),
            VehicleType = request.VehicleType.Trim(),
            TotalSeats = request.TotalSeats
        };

        _db.Vehicles.Add(vehicle);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = vehicle.VehicleId }, new
        {
            vehicle.VehicleId,
            vehicle.VehicleName,
            vehicle.VehicleType,
            vehicle.TotalSeats
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, VehicleRequest request)
    {
        var vehicle = await _db.Vehicles.FindAsync(id);
        if (vehicle == null)
        {
            return NotFound(new { message = "Vehicle not found." });
        }

        vehicle.VehicleName = request.VehicleName.Trim();
        vehicle.VehicleType = request.VehicleType.Trim();
        vehicle.TotalSeats = request.TotalSeats;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            vehicle.VehicleId,
            vehicle.VehicleName,
            vehicle.VehicleType,
            vehicle.TotalSeats
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var vehicle = await _db.Vehicles.FindAsync(id);
        if (vehicle == null)
        {
            return NotFound(new { message = "Vehicle not found." });
        }

        _db.Vehicles.Remove(vehicle);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
