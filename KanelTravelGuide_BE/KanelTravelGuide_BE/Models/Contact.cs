namespace KanelTravelGuide_BE.Models;

public class Contact
{
    public int ContactId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Subject { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsResponded { get; set; }
    public DateTime CreatedAt { get; set; }
}
