using System.ComponentModel.DataAnnotations;

namespace KanelTravelGuide_BE.Contracts;

public class TransportRouteRequest
{
    [Required]
    public int DepartureLocationId { get; set; }

    [Required]
    public int DestinationLocationId { get; set; }

    [Range(0, 10000)]
    public decimal? DistanceKm { get; set; }

    [StringLength(50)]
    public string? EstimatedDuration { get; set; }
}
