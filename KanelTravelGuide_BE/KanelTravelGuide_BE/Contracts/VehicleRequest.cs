using System.ComponentModel.DataAnnotations;

namespace KanelTravelGuide_BE.Contracts;

public class VehicleRequest
{
    [Required, StringLength(100)]
    public string VehicleName { get; set; } = string.Empty;

    [Required, StringLength(50)]
    public string VehicleType { get; set; } = string.Empty;

    [Range(1, 200)]
    public int TotalSeats { get; set; }
}
