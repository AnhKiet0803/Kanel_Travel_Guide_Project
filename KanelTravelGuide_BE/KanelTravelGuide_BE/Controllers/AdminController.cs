using System.Security.Claims;
using KanelTravelGuide_BE.Contracts;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
using KanelTravelGuide_BE.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly DatabaseBackupService _backups;

    public AdminController(AppDbContext db, DatabaseBackupService backups)
    {
        _db = db;
        _backups = backups;
    }

    [HttpGet("feedbacks")]
    public async Task<IActionResult> Feedbacks(int? page, int? pageSize, string? status)
    {
        var (pageNumber, size) = NormalizePage(page, pageSize);
        var query = _db.Feedbacks.AsNoTracking();
        if (status == "pending")
        {
            query = query.Where(item => !item.IsApproved);
        }
        else if (status == "approved")
        {
            query = query.Where(item => item.IsApproved);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(item => item.CreatedAt)
            .Skip((pageNumber - 1) * size)
            .Take(size)
            .Select(item => new
            {
                item.FeedbackId,
                item.FullName,
                item.Email,
                item.Rating,
                item.Title,
                item.Content,
                item.IsApproved,
                item.CreatedAt
            })
            .ToListAsync();

        return Ok(new { items, total });
    }

    [HttpPut("feedbacks/{id:int}/approval")]
    public async Task<IActionResult> SetFeedbackApproval(int id, ApprovalRequest request)
    {
        var feedback = await _db.Feedbacks.FirstOrDefaultAsync(item => item.FeedbackId == id);
        if (feedback is null)
        {
            return NotFound(new { message = "Feedback was not found." });
        }

        feedback.IsApproved = request.IsApproved;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("feedbacks/{id:int}")]
    public async Task<IActionResult> DeleteFeedback(int id)
    {
        var feedback = await _db.Feedbacks.FirstOrDefaultAsync(item => item.FeedbackId == id);
        if (feedback is null)
        {
            return NotFound(new { message = "Feedback was not found." });
        }

        _db.Feedbacks.Remove(feedback);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("contacts")]
    public async Task<IActionResult> Contacts(int? page, int? pageSize, string? status)
    {
        var (pageNumber, size) = NormalizePage(page, pageSize);
        var query = _db.Contacts.AsNoTracking();
        if (status == "pending")
        {
            query = query.Where(item => !item.IsResponded);
        }
        else if (status == "responded")
        {
            query = query.Where(item => item.IsResponded);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(item => item.CreatedAt)
            .Skip((pageNumber - 1) * size)
            .Take(size)
            .Select(item => new
            {
                item.ContactId,
                item.FullName,
                item.Email,
                item.Phone,
                item.Subject,
                item.Message,
                item.IsResponded,
                item.CreatedAt
            })
            .ToListAsync();

        return Ok(new { items, total });
    }

    [HttpPut("contacts/{id:int}/responded")]
    public async Task<IActionResult> SetContactResponded(int id, RespondedRequest request)
    {
        var contact = await _db.Contacts.FirstOrDefaultAsync(item => item.ContactId == id);
        if (contact is null)
        {
            return NotFound(new { message = "Contact was not found." });
        }

        contact.IsResponded = request.IsResponded;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("contacts/{id:int}")]
    public async Task<IActionResult> DeleteContact(int id)
    {
        var contact = await _db.Contacts.FirstOrDefaultAsync(item => item.ContactId == id);
        if (contact is null)
        {
            return NotFound(new { message = "Contact was not found." });
        }

        _db.Contacts.Remove(contact);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("users")]
    public async Task<IActionResult> Users(int? page, int? pageSize, string? search)
    {
        var (pageNumber, size) = NormalizePage(page, pageSize);
        var query = _db.Users.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(user =>
                user.Username.Contains(term) ||
                user.FullName.Contains(term) ||
                user.Email.Contains(term));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(user => user.Username)
            .Skip((pageNumber - 1) * size)
            .Take(size)
            .Select(user => new
            {
                user.UserId,
                user.Username,
                user.FullName,
                user.Email,
                user.Role,
                user.IsActive,
                user.CreatedAt
            })
            .ToListAsync();

        return Ok(new { items, total });
    }

    [HttpPut("users/{id:int}/active")]
    public async Task<IActionResult> SetUserActive(int id, ActiveRequest request)
    {
        var currentId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (currentId == id.ToString() && !request.IsActive)
        {
            return BadRequest(new { message = "You cannot lock your own account." });
        }

        var user = await _db.Users.FirstOrDefaultAsync(item => item.UserId == id);
        if (user is null)
        {
            return NotFound(new { message = "Account was not found." });
        }

        user.IsActive = request.IsActive;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("backups")]
    public async Task<IActionResult> Backup()
    {
        try
        {
            var fileName = await _backups.BackupAsync();
            var createdAt = DateTime.UtcNow;
            var description = $"Backup completed: {fileName}";
            _db.SystemLogs.Add(new SystemLog
            {
                UserId = CurrentUserId(),
                ActionType = "BACKUP",
                ActionDescription = description,
                CreatedAt = createdAt
            });
            await _db.SaveChangesAsync();
            return Ok(new { createdAt, message = description });
        }
        catch (Exception exception)
        {
            _db.SystemLogs.Add(new SystemLog
            {
                UserId = CurrentUserId(),
                ActionType = "BACKUP",
                ActionDescription = $"Backup failed: {exception.Message}",
                CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Database backup failed." });
        }
    }

    [HttpGet("backups")]
    public async Task<IActionResult> Backups(int? page, int? pageSize)
    {
        var (pageNumber, size) = NormalizePage(page, pageSize);
        var query = _db.SystemLogs.AsNoTracking().Where(item => item.ActionType == "BACKUP");
        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(item => item.CreatedAt)
            .Skip((pageNumber - 1) * size)
            .Take(size)
            .Select(item => new
            {
                item.LogId,
                username = item.User != null ? item.User.Username : null,
                item.ActionDescription,
                item.CreatedAt
            })
            .ToListAsync();
        return Ok(new { items, total });
    }

    [HttpPost("backups/restore")]
    public async Task<IActionResult> Restore(RestoreBackupRequest request)
    {
        if (!BackupFileNames.IsSafe(request.FileName))
        {
            return BadRequest(new { message = "Backup file name is invalid." });
        }

        try
        {
            await _backups.RestoreAsync(request.FileName);
            return Ok(new { message = $"Database restored from {request.FileName}." });
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "Backup file was not found." });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Database restore failed." });
        }
    }

    [HttpGet("logs")]
    public async Task<IActionResult> Logs(int? page, int? pageSize)
    {
        var (pageNumber, size) = NormalizePage(page, pageSize);
        var query = _db.SystemLogs.AsNoTracking();
        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(item => item.CreatedAt)
            .Skip((pageNumber - 1) * size)
            .Take(size)
            .Select(item => new
            {
                item.LogId,
                item.UserId,
                username = item.User != null ? item.User.Username : null,
                item.ActionType,
                item.ActionDescription,
                item.CreatedAt
            })
            .ToListAsync();
        return Ok(new { items, total });
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
