using System.ComponentModel.DataAnnotations;

namespace KanelTravelGuide_BE.Contracts;

public class BookingCancelRequest
{
    [StringLength(500)]
    public string? Reason { get; set; }
}

public class BookingStatusUpdateRequest
{
    [StringLength(50)]
    public string? BookingStatus { get; set; }

    [StringLength(50)]
    public string? PaymentStatus { get; set; }
}
