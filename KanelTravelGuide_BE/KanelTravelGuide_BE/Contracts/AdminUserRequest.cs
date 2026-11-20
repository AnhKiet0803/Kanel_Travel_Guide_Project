using System.ComponentModel.DataAnnotations;

namespace KanelTravelGuide_BE.Contracts;

public class AdminUserRequest
{
    [Required, RegularExpression(@"[A-Za-z0-9_.]{3,50}")]
    public string Username { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [RegularExpression(@"\+?[0-9 .-]{8,20}")]
    public string? Phone { get; set; }

    [MaxLength(255)]
    public string? Address { get; set; }

    [Required, RegularExpression("Admin|User")]
    public string Role { get; set; } = "User";

    [MinLength(8), MaxLength(128)]
    public string? Password { get; set; }

    public bool IsActive { get; set; } = true;
}
