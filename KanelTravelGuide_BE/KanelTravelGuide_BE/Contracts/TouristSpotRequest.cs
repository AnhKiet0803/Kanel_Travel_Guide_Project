using System.ComponentModel.DataAnnotations;

namespace KanelTravelGuide_BE.Contracts;

public class TouristSpotRequest
{
    [Required]
    public int LocationId { get; set; }

    [Required]
    public int CategoryId { get; set; }

    [Required, StringLength(200)]
    public string SpotName { get; set; } = string.Empty;

    [StringLength(500)]
    public string? ThumbnailUrl { get; set; }

    public string? Description { get; set; }

    public string? DetailedContent { get; set; }

    public bool IsFeatured { get; set; }
}
