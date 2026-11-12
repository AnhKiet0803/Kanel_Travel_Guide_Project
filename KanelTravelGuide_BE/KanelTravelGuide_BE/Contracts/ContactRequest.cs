using System.ComponentModel.DataAnnotations;

namespace KanelTravelGuide_BE.Contracts;

public class ContactRequest : IValidatableObject
{
    [Required(ErrorMessage = "Full name is required.")]
    [MaxLength(100, ErrorMessage = "Full name must be at most 100 characters.")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Email format is invalid.")]
    [MaxLength(100, ErrorMessage = "Email must be at most 100 characters.")]
    public string Email { get; set; } = string.Empty;

    [MaxLength(20, ErrorMessage = "Phone number must be at most 20 characters.")]
    public string? Phone { get; set; }

    [MaxLength(200, ErrorMessage = "Subject must be at most 200 characters.")]
    public string? Subject { get; set; }

    [Required(ErrorMessage = "Message is required.")]
    [MaxLength(2000, ErrorMessage = "Message must be at most 2000 characters.")]
    public string Message { get; set; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var phone = Phone?.Trim();
        if (!string.IsNullOrEmpty(phone) && !System.Text.RegularExpressions.Regex.IsMatch(phone, @"^\+?[0-9 .-]{8,20}$"))
        {
            yield return new ValidationResult("Phone number is invalid (8–20 digits).", [nameof(Phone)]);
        }
    }
}
