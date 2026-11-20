using System.ComponentModel.DataAnnotations;

namespace KanelTravelGuide_BE.Contracts;

public class TourPackageRequest
{
    public int? SpotId { get; set; }

    public int? PromotionId { get; set; }

    [Required, StringLength(255)]
    public string TourName { get; set; } = string.Empty;

    [Required, StringLength(50)]
    public string Duration { get; set; } = string.Empty;

    [Range(0, 1000000000)]
    public decimal StandardPrice { get; set; }

    [Range(0, 1000000000)]
    public decimal? SalePrice { get; set; }

    public string? ItineraryDetail { get; set; }

    [StringLength(255)]
    public string? MeetingPoint { get; set; }

    [StringLength(255)]
    public string? EndPoint { get; set; }

    [StringLength(2000)]
    public string? TransportDescription { get; set; }

    [StringLength(2000)]
    public string? AccommodationDescription { get; set; }

    [StringLength(2000)]
    public string? GuideDescription { get; set; }

    [StringLength(2000)]
    public string? MealsDescription { get; set; }

    [StringLength(4000)]
    public string? IncludedServices { get; set; }

    [StringLength(4000)]
    public string? ExcludedServices { get; set; }

    public bool IsFeatured { get; set; }
}
