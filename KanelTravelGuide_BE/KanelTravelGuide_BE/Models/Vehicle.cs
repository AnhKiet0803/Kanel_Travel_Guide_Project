namespace KanelTravelGuide_BE.Models;

public class Vehicle
{
    public int VehicleId { get; set; }
    public string VehicleName { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public int TotalSeats { get; set; }

    public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
}
