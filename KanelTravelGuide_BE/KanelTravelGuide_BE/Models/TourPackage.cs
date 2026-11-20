namespace KanelTravelGuide_BE.Models;

public class TourPackage
{
    public int TourId { get; set; }
    public int? SpotId { get; set; }
    public TouristSpot? TouristSpot { get; set; }
    public int? PromotionId { get; set; }
    public Promotion? Promotion { get; set; }
    public string TourName { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public decimal StandardPrice { get; set; }
    public decimal? SalePrice { get; set; }
    public string? ItineraryDetail { get; set; }
    public string? MeetingPoint { get; set; }
    public string? EndPoint { get; set; }
    public string? TransportDescription { get; set; }
    public string? AccommodationDescription { get; set; }
    public string? GuideDescription { get; set; }
    public string? MealsDescription { get; set; }
    public string? IncludedServices { get; set; }
    public string? ExcludedServices { get; set; }
    public bool IsFeatured { get; set; }

    public ICollection<BookingDetail> BookingDetails { get; set; } = new List<BookingDetail>();
}
