namespace KanelTravelGuide_BE.Models;

public class BookingDetail
{
    public int DetailId { get; set; }
    public int BookingId { get; set; }
    public Booking Booking { get; set; } = null!;
    public int? TourId { get; set; }
    public TourPackage? TourPackage { get; set; }
    public int? ScheduleId { get; set; }
    public Schedule? Schedule { get; set; }
    public int? ServiceItemId { get; set; }
    public ServiceItem? ServiceItem { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
}
