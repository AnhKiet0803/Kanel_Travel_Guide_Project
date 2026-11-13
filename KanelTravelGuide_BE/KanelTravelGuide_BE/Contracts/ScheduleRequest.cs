using System.ComponentModel.DataAnnotations;

namespace KanelTravelGuide_BE.Contracts;

public class ScheduleRequest
{
    [Required]
    public int RouteId { get; set; }

    [Required]
    public int VehicleId { get; set; }

    [Required]
    public string DepartureTime { get; set; } = string.Empty; // Format HH:mm or HH:mm:ss

    [Range(0, 1000000000)]
    public decimal TicketPrice { get; set; }

    public int? AvailableSeats { get; set; }

    [StringLength(50)]
    public string Status { get; set; } = "Running";
}
