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

    public bool IsFeatured { get; set; }
}
