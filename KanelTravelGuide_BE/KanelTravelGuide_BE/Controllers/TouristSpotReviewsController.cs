using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/tourist-spots/{spotId:int}/reviews")]
public class TouristSpotReviewsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(int spotId)
    {
        var reviews = await db.Feedbacks.AsNoTracking()
            .Where(review => review.SpotId == spotId && review.IsApproved)
            .OrderByDescending(review => review.CreatedAt)
            .ThenByDescending(review => review.FeedbackId)
            .Select(review => new { review.FeedbackId, review.FullName, review.Rating, review.Content, review.CreatedAt })
            .ToListAsync();

        return Ok(reviews);
    }

    [HttpPost]
    public async Task<IActionResult> Create(int spotId, SpotReviewRequest request)
    {
        if (!await db.TouristSpots.AnyAsync(spot => spot.SpotId == spotId))
            return NotFound(new { message = "Destination not found." });

        User? author = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Unauthorized();
            author = await db.Users.AsNoTracking().SingleOrDefaultAsync(user => user.UserId == userId);
            if (author == null) return Unauthorized();
        }

        var review = new Feedback
        {
            SpotId = spotId,
            AuthorUserId = author?.UserId,
            FullName = author == null ? "Anonymous" : string.IsNullOrWhiteSpace(author.FullName) ? author.Username : author.FullName,
            Email = author?.Email ?? string.Empty,
            Rating = request.Rating,
            Content = request.Content.Trim(),
            IsApproved = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Feedbacks.Add(review);
        await db.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, new
        {
            review.FeedbackId, review.FullName, review.Rating, review.Content, review.CreatedAt
        });
    }

    public class SpotReviewRequest
    {
        [Range(1, 5)] public int Rating { get; set; }
        [Required, MaxLength(2000)] public string Content { get; set; } = string.Empty;
    }
}
