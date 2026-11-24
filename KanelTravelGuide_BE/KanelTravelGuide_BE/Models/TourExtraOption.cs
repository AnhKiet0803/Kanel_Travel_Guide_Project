namespace KanelTravelGuide_BE.Models;

public class TourExtraOption
{
    public int OptionId { get; set; }
    public int TourId { get; set; }
    public int? ServiceItemId { get; set; }
    public int? ScheduleId { get; set; }
    public bool IsEnabled { get; set; } = true;
}
