namespace KanelTravelGuide_BE.Models;

public class Schedule
{
    public int ScheduleId { get; set; }
    public int RouteId { get; set; }
    public TransportRoute Route { get; set; } = null!;
    public int VehicleId { get; set; }
    public Vehicle Vehicle { get; set; } = null!;
    public TimeOnly DepartureTime { get; set; }
    public decimal TicketPrice { get; set; }
    public string Status { get; set; } = "Running";

    public ICollection<BookingDetail> BookingDetails { get; set; } = new List<BookingDetail>();
}
