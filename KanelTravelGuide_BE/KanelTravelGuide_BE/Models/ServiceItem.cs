namespace KanelTravelGuide_BE.Models;

public class ServiceItem
{
    public int ItemId { get; set; }
    public int ProviderId { get; set; }
    public ServiceProvider ServiceProvider { get; set; } = null!;
    public string ItemName { get; set; } = string.Empty;
    public int? Capacity { get; set; }
    public decimal Price { get; set; }
    public int TotalQuantity { get; set; } = 1;
    public bool IsAvailable { get; set; } = true;

    public ICollection<BookingDetail> BookingDetails { get; set; } = new List<BookingDetail>();
}
