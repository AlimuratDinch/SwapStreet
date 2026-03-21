using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace backend.DTOs.Profile
{
    public class CreateProfileDto
    {
        [Required(ErrorMessage = "First name is required")]
        [StringLength(100, ErrorMessage = "First name cannot exceed 100 characters")]
        [JsonPropertyName("firstName")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        [StringLength(100, ErrorMessage = "Last name cannot exceed 100 characters")]
        [JsonPropertyName("lastName")]
        public string LastName { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Bio cannot exceed 500 characters")]
        [JsonPropertyName("bio")]
        public string? Bio { get; set; }

        [Required(ErrorMessage = "City ID is required")]
        [JsonPropertyName("cityId")]
        public int CityId { get; set; }

        [Required(ErrorMessage = "Postal code is required")]
        [StringLength(7, MinimumLength = 7, ErrorMessage = "Postal code must be exactly 7 characters")]
        [RegularExpression(@"^[A-Z]\d[A-Z] \d[A-Z]\d$", ErrorMessage = "Postal code must be in format A1A 1A1")]
        [JsonPropertyName("fsa")]
        public string FSA { get; set; } = string.Empty;

        [JsonPropertyName("profileImagePath")]
        public string? ProfileImagePath { get; set; }

        [JsonPropertyName("bannerImagePath")]
        public string? BannerImagePath { get; set; }
    }
}
