using System.ComponentModel.DataAnnotations;

namespace KanelTravelGuide_BE.Contracts;

public class RegisterRequest : IValidatableObject
{
    [Required(ErrorMessage = "Please enter your username.")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Please enter your password.")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Full name is required.")]
    [MaxLength(100, ErrorMessage = "Full name must be at most 100 characters.")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Email format is invalid.")]
    [MaxLength(100, ErrorMessage = "Email must be at most 100 characters.")]
    public string Email { get; set; } = string.Empty;

    [MaxLength(20, ErrorMessage = "Phone number must be at most 20 characters.")]
    public string? Phone { get; set; }

    [MaxLength(255, ErrorMessage = "Address must be at most 255 characters.")]
    public string? Address { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var username = Username.Trim();
        if (!System.Text.RegularExpressions.Regex.IsMatch(username, @"^[A-Za-z0-9_.]{3,50}$"))
        {
            yield return new ValidationResult(
                "Username must be 3–50 characters: letters, digits, dots and underscores only.",
                [nameof(Username)]);
        }

        if (Password.Length < 8)
        {
            yield return new ValidationResult("Password must be at least 8 characters.", [nameof(Password)]);
        }
        else if (!Password.Any(char.IsLetter) || !Password.Any(char.IsDigit))
        {
            yield return new ValidationResult("Password must contain both letters and digits.", [nameof(Password)]);
        }

        var phone = Phone?.Trim();
        if (!string.IsNullOrEmpty(phone) && !System.Text.RegularExpressions.Regex.IsMatch(phone, @"^\+?[0-9 .-]{8,20}$"))
        {
            yield return new ValidationResult("Phone number is invalid (8–20 digits).", [nameof(Phone)]);
        }
    }
}
