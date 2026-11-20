using System.Data;
using System.Security.Claims;
using KanelTravelGuide_BE.Contracts;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/users")]
public class AdminUsersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(int page = 1, int pageSize = 10, string? search = null)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = db.Users.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(user => user.Username.Contains(term) || user.FullName.Contains(term)
                || user.Email.Contains(term));
        }

        var total = await query.CountAsync();
        page = Math.Clamp(page, 1, Math.Max(1, (int)Math.Ceiling((double)total / pageSize)));
        var items = await query.OrderByDescending(user => user.UserId)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(user => new
            {
                user.UserId, user.Username, user.FullName, user.Email, user.Phone, user.Address,
                user.Role, user.IsActive, user.CreatedAt
            }).ToListAsync();
        return Ok(new { items, total });
    }

    [HttpPost]
    public async Task<IActionResult> Create(AdminUserRequest request)
    {
        if (string.IsNullOrEmpty(request.Password))
            return BadRequest(new { message = "A password is required for a new account." });

        var user = new User { CreatedAt = DateTime.UtcNow };
        var error = ApplyChanges(user, request);
        if (error != null) return error;
        db.Users.Add(user);
        return await SaveAccountAsync(StatusCodes.Status201Created);
    }

    [HttpPut("{id:int}")]
    public Task<IActionResult> Update(int id, AdminUserRequest request) =>
        ChangeAccountAsync(id, (user, isSelf) =>
        {
            if (isSelf && (!request.IsActive || request.Role != "Admin"))
                return BadRequest(new { message = "You must keep your own account active with the Admin role." });

            return ApplyChanges(user, request);
        });

    [HttpPut("{id:int}/active")]
    public Task<IActionResult> SetActive(int id, SetActiveRequest request) =>
        ChangeAccountAsync(id, (user, isSelf) =>
        {
            if (isSelf && !request.IsActive)
                return BadRequest(new { message = "You cannot lock your own account." });
            user.IsActive = request.IsActive;
            return null;
        });

    [HttpDelete("{id:int}")]
    public Task<IActionResult> Delete(int id) =>
        ChangeAccountAsync(id, (user, isSelf) =>
        {
            if (isSelf)
                return BadRequest(new { message = "You cannot delete your own account." });

            if (db.Bookings.Any(booking => booking.UserId == id)
                || db.Feedbacks.Any(review => review.AuthorUserId == id)
                || db.EmailLogs.Any(log => log.UserId == id)
                || db.SystemLogs.Any(log => log.UserId == id)
                || db.Notifications.Any(notification => notification.UserId == id))
                return Conflict(new { message = "This account has linked history. Lock the account to preserve its records." });

            db.Users.Remove(user);
            return null;
        });

    private async Task<IActionResult> ChangeAccountAsync(int id, Func<User, bool, IActionResult?> apply)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var actorId)
            || !await db.Users.AnyAsync(user => user.UserId == actorId && user.IsActive && user.Role == "Admin"))
            return Forbid();

        var target = await db.Users.FindAsync(id);
        if (target == null) return NotFound(new { message = "Account not found." });

        var error = apply(target, id == actorId);
        if (error != null) return error;

        var response = await SaveAccountAsync(StatusCodes.Status204NoContent);
        if (response is NoContentResult) await transaction.CommitAsync();
        return response;
    }

    private IActionResult? ApplyChanges(User user, AdminUserRequest request)
    {
        if (!string.IsNullOrEmpty(request.Password))
        {
            if (!request.Password.Any(char.IsLetter) || !request.Password.Any(char.IsDigit))
                return BadRequest(new { message = "Password must contain both letters and digits." });
            user.PasswordHash = PasswordHasher.Hash(request.Password);
        }

        user.Username = request.Username.Trim();
        user.FullName = request.FullName.Trim();
        user.Email = request.Email.Trim();
        user.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        user.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
        user.Role = request.Role;
        user.IsActive = request.IsActive;
        return null;
    }

    private async Task<IActionResult> SaveAccountAsync(int successStatus)
    {
        try
        {
            await db.SaveChangesAsync();
            return successStatus == StatusCodes.Status201Created
                ? StatusCode(successStatus, new { message = "Account created." })
                : NoContent();
        }
        catch (DbUpdateException ex) when (ex.InnerException is Microsoft.Data.SqlClient.SqlException { Number: 2601 or 2627 or 547 or 1205 } sql)
        {
            return sql.Number switch
            {
                2601 or 2627 => Conflict(new { message = "Username or email is already registered." }),
                547 => Conflict(new { message = "This account has linked history. Lock the account instead." }),
                _ => Conflict(new { message = "Another account change is in progress. Try again." })
            };
        }
    }

    public record SetActiveRequest(bool IsActive);
}
