using System.ComponentModel.DataAnnotations;

namespace KanelTravelGuide_BE.Contracts;

public class ProfileUpdateRequest : IValidatableObject
{
    [Required(ErrorMessage = "Full name is required.")]
    [MaxLength(100, ErrorMessage = "Full name must be at most 100 characters.")]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(20, ErrorMessage = "Phone number must be at most 20 characters.")]
    public string? Phone { get; set; }

    [MaxLength(255, ErrorMessage = "Address must be at most 255 characters.")]
    public string? Address { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(FullName))
        {
            yield return new ValidationResult("Full name is required.", [nameof(FullName)]);
        }

        var phone = Phone?.Trim();
        if (!string.IsNullOrEmpty(phone) && !System.Text.RegularExpressions.Regex.IsMatch(phone, @"^\+?[0-9 .-]{8,20}$"))
        {
            yield return new ValidationResult("Phone number is invalid (8–20 digits).", [nameof(Phone)]);
        }
    }
}

public class ChangePasswordRequest : IValidatableObject
{
    [Required(ErrorMessage = "Please enter your current password.")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Please enter your password.")]
    public string NewPassword { get; set; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (NewPassword.Length < 8)
        {
            yield return new ValidationResult("Password must be at least 8 characters.", [nameof(NewPassword)]);
        }
        else if (!NewPassword.Any(char.IsLetter) || !NewPassword.Any(char.IsDigit))
        {
            yield return new ValidationResult("Password must contain both letters and digits.", [nameof(NewPassword)]);
        }
        else if (NewPassword == CurrentPassword)
        {
            yield return new ValidationResult("New password must be different from the current password.", [nameof(NewPassword)]);
        }
    }
}

public class ApprovalRequest
{
    public bool IsApproved { get; set; }
}

public class RespondedRequest
{
    public bool IsResponded { get; set; }
}

public class ActiveRequest
{
    public bool IsActive { get; set; }
}
