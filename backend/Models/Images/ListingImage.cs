using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class ListingImage
{
    // Primary Key
    [Key]
    public Guid Id { get; set; }

    // Foreign Key to Listing
    [Required]
    public Guid ListingId { get; set; }

    [ForeignKey("ListingId")]
    public Listing? Listing { get; set; }

    [Required]
    [StringLength(255)] // Path/URL to the image file
    public string ImagePath { get; set; } = string.Empty;

    // Determines the order in which images are displayed (e.g., 1 is the primary image)
    public int DisplayOrder { get; set; }

    // Flag indicating if this image is formatted or suitable for a 'try-on' feature
    public bool ForTryon { get; set; }
}