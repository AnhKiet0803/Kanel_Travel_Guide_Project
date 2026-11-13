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

    public AuthController(AppDbContext db, JwtTokenService tokens)
    {
        _db = db;
        _tokens = tokens;
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
}
