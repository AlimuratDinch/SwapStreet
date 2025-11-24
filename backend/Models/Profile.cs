using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Profile
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public ProfileStatusEnum Status { get; set; } = ProfileStatusEnum.Offline;

    public bool VerifiedSeller { get; set; } = false;

    [Required]
    [StringLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(100)] 
    public string LastName { get; set; } = string.Empty;

    [Column(TypeName = "real")]
    public float Rating { get; set; } = 0.0f;

    [StringLength(500)]
    public string? Bio { get; set; }

    [Required]
    public int LocationId { get; set; }

    [ForeignKey("LocationId")]
    public City? City { get; set; }

    [Required]
    [StringLength(3)]
    public string FSA { get; set; } = string.Empty;

    [StringLength(255)]
    public string? ProfileImagePath { get; set; }

    [StringLength(255)]
    public string? BannerImagePath { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum ProfileStatusEnum
{
    Online = 1,
    Offline = 2
}