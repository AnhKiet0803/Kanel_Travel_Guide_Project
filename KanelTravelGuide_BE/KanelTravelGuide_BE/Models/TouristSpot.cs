namespace KanelTravelGuide_BE.Models;

public class TouristSpot
{
    public int SpotId { get; set; }
    public int LocationId { get; set; }
    public Location Location { get; set; } = null!;
    public int CategoryId { get; set; }
    public CategoryType CategoryType { get; set; } = null!;
    public string SpotName { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string? Description { get; set; }
    public string? DetailedContent { get; set; }
    public bool IsFeatured { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<TourPackage> TourPackages { get; set; } = new List<TourPackage>();
}
