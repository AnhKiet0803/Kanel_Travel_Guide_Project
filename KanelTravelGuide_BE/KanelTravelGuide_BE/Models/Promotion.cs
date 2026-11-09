namespace KanelTravelGuide_BE.Models;

public class Promotion
{
    public int PromotionId { get; set; }
    public string? PromoCode { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal? DiscountPercent { get; set; }
    public decimal? DiscountAmount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<TourPackage> TourPackages { get; set; } = new List<TourPackage>();
}
