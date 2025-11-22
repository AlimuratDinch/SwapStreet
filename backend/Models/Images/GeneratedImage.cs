using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class GeneratedImage
{
    [Key]
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    [ForeignKey("UserId")]
    public Profile? User { get; set; }

    public Guid ListingId { get; set; }

    [ForeignKey("ListingId")]
    public Listing? Listing { get; set; }

    [Required]
    [StringLength(255)]
    public string ImagePath { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}