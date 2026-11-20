namespace KanelTravelGuide_BE.Models;

public class TourDeparture
{
    public int TourDepartureId { get; set; }
    public int TourId { get; set; }
    public TourPackage Tour { get; set; } = null!;
    public DateOnly DepartureDate { get; set; }
    public TimeOnly? DepartureTime { get; set; }
    public DateOnly ReturnDate { get; set; }
    public TimeOnly? ReturnTime { get; set; }
    public int Capacity { get; set; }
    public decimal AdultPrice { get; set; }
}
