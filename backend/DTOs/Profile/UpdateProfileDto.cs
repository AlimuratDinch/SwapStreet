using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Profile
{
    public class UpdateProfileDto
    {
        [StringLength(100, ErrorMessage = "First name cannot exceed 100 characters")]
        public string? FirstName { get; set; }

        [StringLength(100, ErrorMessage = "Last name cannot exceed 100 characters")]
        public string? LastName { get; set; }

        [StringLength(500, ErrorMessage = "Bio cannot exceed 500 characters")]
        public string? Bio { get; set; }

        public int? LocationId { get; set; }

        [StringLength(3, MinimumLength = 3, ErrorMessage = "FSA must be exactly 3 characters")]
        [RegularExpression(@"^[A-Z]\d[A-Z]$", ErrorMessage = "FSA must be in format: Letter-Digit-Letter (e.g., M5V)")]
        public string? FSA { get; set; }

        public string? ProfileImagePath { get; set; }

        public string? BannerImagePath { get; set; }

        public ProfileStatusEnum? Status { get; set; }
    }
}
