namespace KanelTravelGuide_BE.Models;

public class ServiceProvider
{
    public int ProviderId { get; set; }
    public int LocationId { get; set; }
    public Location Location { get; set; } = null!;
    public string ServiceType { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public int? StarRating { get; set; }
    public string Address { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<ServiceItem> Items { get; set; } = new List<ServiceItem>();
}
