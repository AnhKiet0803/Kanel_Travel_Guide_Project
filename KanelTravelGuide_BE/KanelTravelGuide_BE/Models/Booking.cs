namespace KanelTravelGuide_BE.Models;

public class Booking
{
    public int BookingId { get; set; }
    public string BookingCode { get; set; } = string.Empty;
    public int? UserId { get; set; }
    public User? User { get; set; }
    public int? PromotionId { get; set; }
    public Promotion? Promotion { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string BookingType { get; set; } = string.Empty;
    public DateTime BookingDate { get; set; }
    public DateOnly StartDate { get; set; }
    public int TotalPassengers { get; set; }
    public decimal DiscountAmount { get; set; } = 0;
    public decimal TotalAmount { get; set; }
    public string PaymentStatus { get; set; } = "Unpaid";
    public string BookingStatus { get; set; } = "Pending";
    public string? Notes { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public ICollection<BookingDetail> Details { get; set; } = new List<BookingDetail>();
    public ICollection<EmailLog> EmailLogs { get; set; } = new List<EmailLog>();
}
