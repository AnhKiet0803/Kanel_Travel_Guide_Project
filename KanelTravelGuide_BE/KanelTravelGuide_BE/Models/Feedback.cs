namespace KanelTravelGuide_BE.Models;

public class Feedback
{
    public int FeedbackId { get; set; }
    public int? TourId { get; set; }
    public TourPackage? Tour { get; set; }
    public int? SpotId { get; set; }
    public TouristSpot? Spot { get; set; }
    public int? AuthorUserId { get; set; }
    public User? AuthorUser { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int? Rating { get; set; }
    public string? Title { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsApproved { get; set; }
    public DateTime CreatedAt { get; set; }
}
