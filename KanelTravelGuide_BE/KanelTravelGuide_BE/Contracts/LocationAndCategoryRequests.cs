using System.ComponentModel.DataAnnotations;

namespace KanelTravelGuide_BE.Contracts;

public class LocationRequest
{
    [Required, StringLength(100)]
    public string LocationName { get; set; } = string.Empty;

    [Required, StringLength(50)]
    public string Region { get; set; } = string.Empty;

    public string? Description { get; set; }
}

public class CategoryTypeRequest
{
    [Required, StringLength(100)]
    public string CategoryName { get; set; } = string.Empty;
}
