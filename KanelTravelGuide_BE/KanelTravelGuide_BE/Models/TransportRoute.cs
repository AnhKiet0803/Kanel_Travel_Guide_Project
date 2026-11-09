namespace KanelTravelGuide_BE.Models;

public class TransportRoute
{
    public int RouteId { get; set; }
    public int DepartureLocationId { get; set; }
    public Location DepartureLocation { get; set; } = null!;
    public int DestinationLocationId { get; set; }
    public Location DestinationLocation { get; set; } = null!;
    public decimal? DistanceKm { get; set; }
    public string? EstimatedDuration { get; set; }

    public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
}
