using System.ComponentModel.DataAnnotations;

namespace KanelTravelGuide_BE.Contracts;

public class PromotionRequest
{
    [StringLength(50)]
    public string? PromoCode { get; set; }

    [Required, StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Range(0, 100)]
    public decimal? DiscountPercent { get; set; }

    [Range(0, 1000000000)]
    public decimal? DiscountAmount { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; } = true;
}
