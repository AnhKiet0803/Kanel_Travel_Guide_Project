using System.ComponentModel.DataAnnotations;

namespace KanelTravelGuide_BE.Contracts;

public class BookingDetailRequest
{
    public int? TourId { get; set; }

    public int? ScheduleId { get; set; }

    public int? ServiceItemId { get; set; }

    [Range(1, 1000)]
    public int Quantity { get; set; } = 1;

    [Range(0, 1000000000)]
    public decimal? UnitPrice { get; set; }
}

public class BookingRequest
{
    public int? TourDepartureId { get; set; }
    public int? AdultCount { get; set; }

    [MaxLength(1000)]
    public List<int>? ChildAges { get; set; }

    [Required, StringLength(100)]
    public string CustomerName { get; set; } = string.Empty;

    [Required, StringLength(20)]
    public string CustomerPhone { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(100)]
    public string CustomerEmail { get; set; } = string.Empty;

    [Required, RegularExpression("^(Tour|Transport|Service|Combo)$", ErrorMessage = "bookingType must be Tour, Transport, Service, or Combo.")]
    public string BookingType { get; set; } = "Tour";

    [Required]
    public string StartDate { get; set; } = string.Empty; // Format YYYY-MM-DD

    [Range(1, 1000)]
    public int TotalPassengers { get; set; } = 1;

    [RegularExpression("^(BankTransfer|PayAfterConfirmation|PayPalSandbox)$", ErrorMessage = "Invalid payment method.")]
    public string? PaymentMethod { get; set; }

    public string? PromoCode { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    [Required, MinLength(1, ErrorMessage = "At least one booking detail is required.")]
    public List<BookingDetailRequest> Details { get; set; } = new();
}
