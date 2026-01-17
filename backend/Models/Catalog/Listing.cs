using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NpgsqlTypes;

public class Listing
{
    // Primary Key
    [Key]
    public Guid Id { get; set; }

    [Required(ErrorMessage = "Title is required")]
    [StringLength(255, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required")]
    [StringLength(1000, MinimumLength = 10)]
    public string Description { get; set; } = string.Empty;

    [Column(TypeName = "decimal(10,2)")]
    public decimal Price { get; set; } = 0.00M;

    // Foreign Key to Profile (the seller)
    [Required]
    public Guid ProfileId { get; set; }

    [ForeignKey("ProfileId")]
    public Profile? Profile { get; set; }

    // Foreign Key to Tag
    public Guid? TagId { get; set; }

    [ForeignKey("TagId")]
    public Tag? Tag { get; set; }

    // Full-Text Search Vector, "SearchText" (computed column in DB) and can be accessed context.Listings.Where(l => EF.Property<string>(l, "SearchText") != null)

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}