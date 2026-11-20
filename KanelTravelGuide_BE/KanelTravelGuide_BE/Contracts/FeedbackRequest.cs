using System.ComponentModel.DataAnnotations;

namespace KanelTravelGuide_BE.Contracts;

public class FeedbackRequest : IValidatableObject
{
    [Range(1, int.MaxValue)]
    public int? TourId { get; set; }

    [MaxLength(100, ErrorMessage = "Full name must be at most 100 characters.")]
    public string? FullName { get; set; }

    [MaxLength(100, ErrorMessage = "Email must be at most 100 characters.")]
    public string? Email { get; set; }

    public int? Rating { get; set; }

    [MaxLength(200, ErrorMessage = "Title must be at most 200 characters.")]
    public string? Title { get; set; }

    [Required(ErrorMessage = "Feedback is required.")]
    [MaxLength(2000, ErrorMessage = "Feedback must be at most 2000 characters.")]
    public string Content { get; set; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!TourId.HasValue)
        {
            if (string.IsNullOrWhiteSpace(FullName))
                yield return new ValidationResult("Full name is required.", [nameof(FullName)]);
            if (string.IsNullOrWhiteSpace(Email))
                yield return new ValidationResult("Email is required.", [nameof(Email)]);
            else if (!new EmailAddressAttribute().IsValid(Email.Trim()))
                yield return new ValidationResult("Email format is invalid.", [nameof(Email)]);
        }

        if (Rating is < 1 or > 5 || (TourId.HasValue && Rating == null))
        {
            yield return new ValidationResult("Rating must be from 1 to 5 stars.", [nameof(Rating)]);
        }
    }
}
