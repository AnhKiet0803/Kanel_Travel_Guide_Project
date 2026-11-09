namespace KanelTravelGuide_BE.Models;

public class EmailLog
{
    public int EmailLogId { get; set; }
    public int? BookingId { get; set; }
    public Booking? Booking { get; set; }
    public int? UserId { get; set; }
    public User? User { get; set; }
    public string RecipientEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string BodyContent { get; set; } = string.Empty;
    public string SendStatus { get; set; } = "PENDING";
    public string? ErrorMessage { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
