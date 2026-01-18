using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Size
{
    // Primary Key
    [Key]
    public Guid Id { get; set; }

    // Foreign Key to ArticleType
    [Required]
    public Guid ArticleTypeId { get; set; }

    [ForeignKey("ArticleTypeId")]
    public ArticleType? ArticleType { get; set; }

    [Required]
    [StringLength(50)]
    public string Value { get; set; } = string.Empty; // e.g., "S", "M", "32x30"

    public int DisplayOrder { get; set; }
}