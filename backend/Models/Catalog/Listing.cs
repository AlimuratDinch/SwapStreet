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

    public float Price { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    // Foreign Key to Profile (the seller)
    [Required]
    public Guid ProfileID { get; set; }

    [ForeignKey("ProfileID")]
    public Profile? Profile { get; set; }

    // Foreign Key to Tag
    [Required]
    public Guid TagId { get; set; }

    [ForeignKey("TagId")]
    public Tag? Tag { get; set; }
}