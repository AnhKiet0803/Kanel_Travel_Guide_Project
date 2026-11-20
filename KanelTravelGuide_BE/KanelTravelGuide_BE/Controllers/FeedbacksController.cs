using System.Security.Claims;
using KanelTravelGuide_BE.Contracts;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/feedbacks")]
public class FeedbacksController : ControllerBase
{
    private readonly AppDbContext _db;

    public FeedbacksController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Create(FeedbackRequest request)
    {
        if (request.TourId is int tourId && !await _db.TourPackages.AnyAsync(tour => tour.TourId == tourId))
        {
            return NotFound(new { message = "Tour not found." });
        }

        var isTourReview = request.TourId.HasValue;
        User? author = null;
        if (isTourReview && User.Identity?.IsAuthenticated == true)
        {
            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Unauthorized();
            author = await _db.Users.AsNoTracking().SingleOrDefaultAsync(user => user.UserId == userId);
            if (author == null) return Unauthorized();
        }

        var authorName = author == null ? "Anonymous"
            : string.IsNullOrWhiteSpace(author.FullName) ? author.Username : author.FullName;

        var feedback = new Feedback
        {
            TourId = request.TourId,
            AuthorUserId = author?.UserId,
            FullName = isTourReview ? authorName : request.FullName!.Trim(),
            Email = isTourReview ? author?.Email ?? string.Empty : request.Email!.Trim(),
            Rating = request.Rating,
            Title = string.IsNullOrWhiteSpace(request.Title) ? null : request.Title.Trim(),
            Content = request.Content.Trim(),
            IsApproved = isTourReview,
            CreatedAt = DateTime.UtcNow
        };

        _db.Feedbacks.Add(feedback);
        await _db.SaveChangesAsync();

        return Created($"/api/feedbacks/{feedback.FeedbackId}", new
        {
            feedback.FeedbackId,
            feedback.IsApproved
        });
    }

    [HttpGet("/api/tours/{tourId:int}/reviews")]
    public Task<IActionResult> TourReviews(int tourId) => Approved(tourId);

    [HttpGet("approved")]
    public async Task<IActionResult> Approved([FromQuery] int? tourId)
    {
        var items = await _db.Feedbacks
            .AsNoTracking()
            .Where(item => item.IsApproved && item.SpotId == null && item.TourId == tourId)
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.FeedbackId)
            .Select(item => new
            {
                item.FeedbackId,
                item.FullName,
                item.Rating,
                item.Title,
                item.Content,
                item.CreatedAt
            })
            .ToListAsync();

        return Ok(items);
    }
}
