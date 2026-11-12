using System.ComponentModel.DataAnnotations;

namespace KanelTravelGuide_BE.Contracts;

public class FeedbackRequest : IValidatableObject
{
    [Required(ErrorMessage = "Full name is required.")]
    [MaxLength(100, ErrorMessage = "Full name must be at most 100 characters.")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Email format is invalid.")]
    [MaxLength(100, ErrorMessage = "Email must be at most 100 characters.")]
    public string Email { get; set; } = string.Empty;

    public int? Rating { get; set; }

    [MaxLength(200, ErrorMessage = "Title must be at most 200 characters.")]
    public string? Title { get; set; }

    [Required(ErrorMessage = "Feedback is required.")]
    [MaxLength(2000, ErrorMessage = "Feedback must be at most 2000 characters.")]
    public string Content { get; set; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Rating is < 1 or > 5)
        {
            yield return new ValidationResult("Rating must be from 1 to 5 stars.", [nameof(Rating)]);
        }
    }
}
