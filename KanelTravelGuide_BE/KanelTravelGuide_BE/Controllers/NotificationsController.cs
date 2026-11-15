using System.Security.Claims;
using KanelTravelGuide_BE.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Authorize]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private static readonly string[] Types = ["BOOKING", "PROMOTION", "SYSTEM"];
    private readonly AppDbContext _db;

    public NotificationsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> List(int? page, int? pageSize, string? type)
    {
        var userId = CurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "Sign in is required." });
        }

        var (pageNumber, size) = NormalizePage(page, pageSize);
        var query = _db.Notifications.AsNoTracking().Where(item => item.UserId == userId);
        if (!string.IsNullOrWhiteSpace(type) && Types.Contains(type))
        {
            query = query.Where(item => item.NotificationType == type);
        }

        var total = await query.CountAsync();
        var unreadCount = await _db.Notifications.CountAsync(item => item.UserId == userId && !item.IsRead);
        var items = await query
            .OrderByDescending(item => item.CreatedAt)
            .Skip((pageNumber - 1) * size)
            .Take(size)
            .Select(item => new
            {
                item.NotificationId,
                item.Title,
                item.Message,
                item.NotificationType,
                item.ReferenceId,
                item.IsRead,
                item.CreatedAt
            })
            .ToListAsync();

        return Ok(new { items, total, unreadCount });
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var userId = CurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "Sign in is required." });
        }

        await _db.Notifications
            .Where(item => item.UserId == userId && !item.IsRead)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.IsRead, true));
        return NoContent();
    }

    [HttpPut("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var userId = CurrentUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "Sign in is required." });
        }

        var notification = await _db.Notifications.FirstOrDefaultAsync(item => item.NotificationId == id && item.UserId == userId);
        if (notification is null)
        {
            return NotFound(new { message = "Notification was not found." });
        }

        notification.IsRead = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private int? CurrentUserId()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(id, out var userId) ? userId : null;
    }

    private static (int Page, int Size) NormalizePage(int? page, int? pageSize)
    {
        var pageNumber = page is null or < 1 ? 1 : page.Value;
        var size = pageSize is null or < 1 ? 10 : Math.Min(pageSize.Value, 100);
        return (pageNumber, size);
    }
}
