using System.ComponentModel.DataAnnotations;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/tours/{tourId:int}/extras")]
public class TourExtrasController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(int tourId, bool includeDisabled = false)
    {
        if (includeDisabled && !User.IsInRole("Admin")) return Forbid();
        if (!await db.TourPackages.AnyAsync(t => t.TourId == tourId)) return NotFound();
        return Ok(await db.TourExtraOptions.AsNoTracking()
            .Where(o => o.TourId == tourId && (includeDisabled || (o.IsEnabled
                && ((o.ServiceItemId.HasValue && db.ServiceItems.Any(i => i.ItemId == o.ServiceItemId && i.IsAvailable && i.ServiceProvider.IsActive))
                    || (o.ScheduleId.HasValue && db.Schedules.Any(s => s.ScheduleId == o.ScheduleId && s.Status == "Running")))))).OrderBy(o => o.OptionId)
            .Select(o => new
            {
                o.OptionId, o.ServiceItemId, o.ScheduleId, o.IsEnabled,
                providerId = db.ServiceItems.Where(i => i.ItemId == o.ServiceItemId).Select(i => (int?)i.ProviderId).FirstOrDefault()
            }).ToListAsync());
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Add(int tourId, ExtraRequest input)
    {
        if (input.ServiceItemId.HasValue == input.ScheduleId.HasValue)
            return BadRequest(new { message = "Choose one room, dining option or transport schedule." });
        if (!await db.TourPackages.AnyAsync(t => t.TourId == tourId)) return NotFound();
        if (input.ServiceItemId.HasValue && !await db.ServiceItems.AnyAsync(i => i.ItemId == input.ServiceItemId))
            return BadRequest(new { message = "Service item not found." });
        if (input.ScheduleId.HasValue && !await db.Schedules.AnyAsync(s => s.ScheduleId == input.ScheduleId))
            return BadRequest(new { message = "Transport schedule not found." });
        if (await db.TourExtraOptions.AnyAsync(o => o.TourId == tourId
            && o.ServiceItemId == input.ServiceItemId && o.ScheduleId == input.ScheduleId))
            return Conflict(new { message = "This option is already linked to the tour. Edit its visibility instead." });
        var item = new TourExtraOption { TourId = tourId, ServiceItemId = input.ServiceItemId, ScheduleId = input.ScheduleId, IsEnabled = input.IsEnabled };
        db.TourExtraOptions.Add(item);
        try { await db.SaveChangesAsync(); }
        catch (DbUpdateException) { return Conflict(new { message = "The option changed or was linked by another administrator. Refresh and try again." }); }
        return StatusCode(201, new { item.OptionId });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{optionId:int}")]
    public async Task<IActionResult> Visibility(int tourId, int optionId, VisibilityRequest input)
    {
        var option = await db.TourExtraOptions.SingleOrDefaultAsync(o => o.OptionId == optionId && o.TourId == tourId);
        if (option == null) return NotFound();
        option.IsEnabled = input.IsEnabled!.Value;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{optionId:int}")]
    public async Task<IActionResult> Remove(int tourId, int optionId)
    {
        var option = await db.TourExtraOptions.SingleOrDefaultAsync(o => o.OptionId == optionId && o.TourId == tourId);
        if (option == null) return NotFound();
        db.TourExtraOptions.Remove(option);
        await db.SaveChangesAsync();
        return NoContent();
    }

    public class VisibilityRequest { [Required] public bool? IsEnabled { get; set; } }
    public class ExtraRequest
    {
        [Range(1, int.MaxValue)] public int? ServiceItemId { get; set; }
        [Range(1, int.MaxValue)] public int? ScheduleId { get; set; }
        public bool IsEnabled { get; set; } = true;
    }
}
