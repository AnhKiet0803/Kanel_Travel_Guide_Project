namespace KanelTravelGuide_BE.Models;

public class SystemLog
{
    public int LogId { get; set; }
    public int? UserId { get; set; }
    public User? User { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string? ActionDescription { get; set; }
    public DateTime CreatedAt { get; set; }
}
