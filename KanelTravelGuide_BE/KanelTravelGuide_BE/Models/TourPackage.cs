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
    public bool IsFeatured { get; set; }

    public ICollection<BookingDetail> BookingDetails { get; set; } = new List<BookingDetail>();
}
