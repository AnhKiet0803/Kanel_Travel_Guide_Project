namespace KanelTravelGuide_BE.Models;

public class CategoryType
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;

    public ICollection<TouristSpot> TouristSpots { get; set; } = new List<TouristSpot>();
}
