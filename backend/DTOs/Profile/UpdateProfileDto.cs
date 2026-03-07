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

        [StringLength(3, ErrorMessage = "FSA must be at most 3 characters")]
        public string? FSA { get; set; }

        public string? ProfileImagePath { get; set; }

        public string? BannerImagePath { get; set; }

        public ProfileStatusEnum? Status { get; set; }
    }
}
