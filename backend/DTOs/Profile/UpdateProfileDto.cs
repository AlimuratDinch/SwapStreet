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

        public int? CityId { get; set; }

        [StringLength(7, MinimumLength = 7, ErrorMessage = "Postal code must be exactly 7 characters")]
        [RegularExpression(@"^[A-Z]\d[A-Z] \d[A-Z]\d$", ErrorMessage = "Postal code must be in format A1A 1A1 (e.g., A1A 1A1)")]
        public string? FSA { get; set; }

        public string? ProfileImagePath { get; set; }

        public string? BannerImagePath { get; set; }

        public ProfileStatusEnum? Status { get; set; }
    }
}
