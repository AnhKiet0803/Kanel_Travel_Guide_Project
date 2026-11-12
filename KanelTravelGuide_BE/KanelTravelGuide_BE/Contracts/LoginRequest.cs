using System.ComponentModel.DataAnnotations;

namespace KanelTravelGuide_BE.Contracts;

public class LoginRequest
{
    [Required(ErrorMessage = "Please enter your username.")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Please enter your password.")]
    public string Password { get; set; } = string.Empty;
}
