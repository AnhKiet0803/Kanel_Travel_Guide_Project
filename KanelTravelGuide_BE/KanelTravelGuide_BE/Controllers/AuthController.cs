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
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtTokenService _tokens;
    private readonly IEmailSender _email;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AppDbContext db, JwtTokenService tokens, IEmailSender email, ILogger<AuthController> logger)
    {
        _db = db;
        _tokens = tokens;
        _email = email;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var username = request.Username.Trim();
        var email = request.Email.Trim();

        if (await _db.Users.AnyAsync(user => user.Username == username))
        {
            return Conflict(new { message = "Username is already taken." });
        }

        if (await _db.Users.AnyAsync(user => user.Email == email))
        {
            return Conflict(new { message = "Email is already registered." });
        }

        var user = new User
        {
            Username = username,
            PasswordHash = PasswordHasher.Hash(request.Password),
            FullName = request.FullName.Trim(),
            Email = email,
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim(),
            Role = "User",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "Username or email is already registered." });
        }

        return StatusCode(StatusCodes.Status201Created, new
        {
            user.UserId,
            user.Username,
            user.FullName,
            user.Email,
            user.Phone,
            user.Role,
            user.IsActive
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var username = request.Username.Trim();
        var user = await _db.Users.FirstOrDefaultAsync(item => item.Username == username);
        if (user is null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Incorrect username or password." });
        }

        if (!user.IsActive)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "This account is disabled." });
        }

        return Ok(SignedInUser(user));
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await CurrentUserAsync();
        if (user is null || !user.IsActive)
        {
            return Unauthorized(new { message = "Sign in is required." });
        }

        return Ok(PublicUser(user));
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> Profile()
    {
        var user = await CurrentUserAsync();
        if (user is null || !user.IsActive)
        {
            return Unauthorized(new { message = "Sign in is required." });
        }

        return Ok(ProfileBody(user));
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(ProfileUpdateRequest request)
    {
        var user = await CurrentUserAsync();
        if (user is null || !user.IsActive)
        {
            return Unauthorized(new { message = "Sign in is required." });
        }

        user.FullName = request.FullName.Trim();
        user.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        user.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
        await _db.SaveChangesAsync();
        return Ok(ProfileBody(user));
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var user = await CurrentUserAsync();
        if (user is null || !user.IsActive)
        {
            return Unauthorized(new { message = "Sign in is required." });
        }

        if (!PasswordHasher.Verify(request.CurrentPassword, user.PasswordHash))
        {
            return BadRequest(new { message = "Current password is incorrect." });
        }

        user.PasswordHash = PasswordHasher.Hash(request.NewPassword);
        AddSystemNote(user, "UPDATE", "Changed the account password.");
        AddSystemNotification(user, "Password changed", "Your password was changed.");
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        var email = request.Email.Trim();
        var generic = new { message = "If this email is registered, we have sent instructions to reset your password." };
        var user = await _db.Users.FirstOrDefaultAsync(item => item.Email == email && item.IsActive);
        if (user is null)
        {
            return Ok(generic);
        }

        var token = PasswordResetTokens.Create();
        var link = $"{_email.FrontendBaseUrl}/reset-password?token={Uri.EscapeDataString(token)}";
        var body = $"Use this link within 1 hour to choose a new password:\n{link}\n\n{PasswordResetTokens.HashLine(token)}";
        var status = "SENT";
        string? error = null;
        if (_email.IsConfigured)
        {
            try
            {
                await _email.SendAsync(user.Email, PasswordResetTokens.Subject, body);
            }
            catch (Exception exception)
            {
                status = "FAILED";
                error = exception.Message;
                _logger.LogWarning(exception, "Password reset email could not be sent.");
            }
        }
        else
        {
            body += "\n\nDelivery: stored in EmailLogs because SMTP is not configured.";
            _logger.LogInformation("Password reset link for {Email}: {Link}", user.Email, link);
        }

        _db.EmailLogs.Add(new EmailLog
        {
            UserId = user.UserId,
            RecipientEmail = user.Email,
            Subject = PasswordResetTokens.Subject,
            BodyContent = body,
            SendStatus = status,
            ErrorMessage = error,
            SentAt = status == "SENT" ? DateTime.UtcNow : null,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        if (status == "FAILED")
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "The reset email could not be sent. Please try again later." });
        }

        return Ok(generic);
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        var hashLine = PasswordResetTokens.HashLine(request.Token);
        var earliest = DateTime.UtcNow.Subtract(PasswordResetTokens.Lifetime);
        var matches = await _db.EmailLogs
            .Where(item => item.Subject == PasswordResetTokens.Subject
                && item.SendStatus == "SENT"
                && item.ErrorMessage == null
                && item.CreatedAt >= earliest
                && item.UserId != null)
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync();
        var match = matches.FirstOrDefault(item => item.BodyContent.Contains(hashLine, StringComparison.Ordinal));
        if (match?.UserId is null)
        {
            return BadRequest(new { message = "This reset link is invalid or has expired." });
        }

        var user = await _db.Users.FirstOrDefaultAsync(item => item.UserId == match.UserId && item.IsActive);
        if (user is null)
        {
            return BadRequest(new { message = "This reset link is invalid or has expired." });
        }

        user.PasswordHash = PasswordHasher.Hash(request.NewPassword);
        match.ErrorMessage = "USED";
        AddSystemNote(user, "UPDATE", "Reset the account password from an email link.");
        AddSystemNotification(user, "Password reset", "Your password was reset.");
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<User?> CurrentUserAsync()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(id, out var userId))
        {
            return null;
        }

        return await _db.Users.FirstOrDefaultAsync(user => user.UserId == userId);
    }

    private object SignedInUser(User user) => new
    {
        token = _tokens.CreateToken(user),
        user.UserId,
        user.Username,
        user.FullName,
        user.Email,
        user.Role
    };

    private static object PublicUser(User user) => new
    {
        user.UserId,
        user.Username,
        user.FullName,
        user.Email,
        user.Role
    };

    private void AddSystemNote(User user, string actionType, string description)
    {
        _db.SystemLogs.Add(new SystemLog
        {
            UserId = user.UserId,
            ActionType = actionType,
            ActionDescription = description,
            CreatedAt = DateTime.UtcNow
        });
    }

    private void AddSystemNotification(User user, string title, string message)
    {
        _db.Notifications.Add(new Notification
        {
            UserId = user.UserId,
            Title = title,
            Message = message,
            NotificationType = "SYSTEM",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });
    }

    private static object ProfileBody(User user) => new
    {
        user.UserId,
        user.Username,
        user.FullName,
        user.Email,
        user.Phone,
        user.Address,
        user.Role,
        user.IsActive
    };
}
