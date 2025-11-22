using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Listing
{
    // Primary Key
    [Key]
    public Guid Id { get; set; }

    [Required]
    [StringLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column(TypeName = "decimal(10,2)")]
    public decimal Price { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    // Foreign Key to Profile (the seller)
    [Required]
    public Guid ProfileId { get; set; }

    [ForeignKey("ProfileId")]
    public Profile? Profile { get; set; }

    // Foreign Key to Tag
    [Required]
    public Guid TagId { get; set; }

    [ForeignKey("TagId")]
    public Tag? Tag { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}