using System.ComponentModel.DataAnnotations;

namespace KanelTravelGuide_BE.Contracts;

public class ServiceProviderRequest
{
    [Required]
    public int LocationId { get; set; }

    [Required, RegularExpression("^(Hotel|Resort|Restaurant)$", ErrorMessage = "serviceType must be Hotel, Resort, or Restaurant.")]
    public string ServiceType { get; set; } = string.Empty;

    [Required, StringLength(200)]
    public string ProviderName { get; set; } = string.Empty;

    [Range(1, 5)]
    public int? StarRating { get; set; }

    [Required, StringLength(255)]
    public string Address { get; set; } = string.Empty;

    [StringLength(20)]
    public string? Phone { get; set; }

    [StringLength(255)]
    public string? Website { get; set; }

    [Range(0, 1000000000)]
    public decimal? MinPrice { get; set; }

    [Range(0, 1000000000)]
    public decimal? MaxPrice { get; set; }

    public string? Description { get; set; }

    [StringLength(500)]
    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;
}
