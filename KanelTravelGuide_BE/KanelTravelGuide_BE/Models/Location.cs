namespace KanelTravelGuide_BE.Models;

public class Location
{
    public int LocationId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<TouristSpot> TouristSpots { get; set; } = new List<TouristSpot>();
    public ICollection<ServiceProvider> ServiceProviders { get; set; } = new List<ServiceProvider>();
    public ICollection<TransportRoute> DepartureRoutes { get; set; } = new List<TransportRoute>();
    public ICollection<TransportRoute> DestinationRoutes { get; set; } = new List<TransportRoute>();
}
