namespace backend.DTOs.Profile
{
    public class ProfileResponseDto
    {
        public Guid Id { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool VerifiedSeller { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public float Rating { get; set; }
        public string? Bio { get; set; }
        public int LocationId { get; set; }
        public string? CityName { get; set; }
        public string? ProvinceName { get; set; }
        public string? ProvinceCode { get; set; }
        public string FSA { get; set; } = string.Empty;
        public string? ProfileImagePath { get; set; }
        public string? BannerImagePath { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
