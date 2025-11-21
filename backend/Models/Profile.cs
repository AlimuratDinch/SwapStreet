using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Profile
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public ProfileStatusEnum Status { get; set; }

    public bool VerifiedSeller { get; set; }

    [Required]
    [StringLength(100)] 
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(100)] 
    public string Lastname { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Rating { get; set; }

    [StringLength(500)] 
    public string? Bio { get; set; }

    [Required]
    public int CityId { get; set; }

    [ForeignKey("CityId")]
    public City? City { get; set; }

    [Required]
    [StringLength(3)]
    public string FSA { get; set; } = string.Empty;

    [StringLength(255)]
    public string? ProfileImagePath { get; set; }

    [StringLength(255)]
    public string? BannerImagePath { get; set; }
}

public enum ProfileStatusEnum
{
    Active = 1,
    Suspended = 2,
    Deactivated = 3,
    PendingVerification = 4,
    Banned = 5
}