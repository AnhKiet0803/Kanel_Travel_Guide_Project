using System.ComponentModel.DataAnnotations;

namespace KanelTravelGuide_BE.Contracts;

public class ServiceItemRequest
{
    [Required, StringLength(150)]
    public string ItemName { get; set; } = string.Empty;

    public int? Capacity { get; set; }

    [Range(0, 1000000000)]
    public decimal Price { get; set; }

    [Range(1, 10000)]
    public int TotalQuantity { get; set; } = 1;

    public bool IsAvailable { get; set; } = true;
}
