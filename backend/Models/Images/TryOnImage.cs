using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class TryOnImage
{
    [Key]
    public int Id { get; set; } // Convert to GUID

    [Required]
    public Guid ProfileId { get; set; }

    [Required]
    [StringLength(255)] // Path/URL to the image file
    public string ImagePath { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("ProfileId")]

        // Navigation property
    public Profile? Profile { get; set; }
}