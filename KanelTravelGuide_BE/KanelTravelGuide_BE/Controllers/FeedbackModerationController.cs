using KanelTravelGuide_BE.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/feedbacks")]
public class FeedbackModerationController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(int page = 1, int pageSize = 10, string? status = null)
    {
        if (page < 1 || page > 1000000 || pageSize is < 1 or > 100)
        {
            return BadRequest(new { message = "Invalid page or page size." });
        }

        var query = db.Feedbacks.AsNoTracking();
        query = status switch
        {
            "pending" => query.Where(item => !item.IsApproved),
            "approved" => query.Where(item => item.IsApproved),
            _ => query
        };

        var total = await query.CountAsync();
        var items = await query.OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.FeedbackId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(item => new
            {
                item.FeedbackId,
                item.TourId,
                tourName = item.Tour == null ? null : item.Tour.TourName,
                item.SpotId,
                spotName = item.Spot == null ? null : item.Spot.SpotName,
                item.FullName,
                item.Email,
                item.Rating,
                item.Title,
                item.Content,
                item.IsApproved,
                item.CreatedAt
            }).ToListAsync();

        return Ok(new { items, total });
    }

    [HttpPut("{id:int}/approval")]
    public async Task<IActionResult> SetApproval(int id, ApprovalRequest request)
    {
        if (request.IsApproved is not bool isApproved)
        {
            return BadRequest(new { message = "isApproved is required." });
        }

        var feedback = await db.Feedbacks.FindAsync(id);
        if (feedback == null) return NotFound(new { message = "Feedback not found." });
        feedback.IsApproved = isApproved;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var feedback = await db.Feedbacks.FindAsync(id);
        if (feedback == null) return NotFound(new { message = "Feedback not found." });
        db.Feedbacks.Remove(feedback);
        await db.SaveChangesAsync();
        return NoContent();
    }

    public record ApprovalRequest(bool? IsApproved);
}
