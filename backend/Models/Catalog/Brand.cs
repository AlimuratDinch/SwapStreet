using System.ComponentModel.DataAnnotations;

public class Brand
{
    // Primary Key
    [Key]
    public Guid Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty; // e.g., "Adidas", "Gucci", "H&M"
    
    // Optional path to the brand's logo
    [StringLength(255)]
    public string? LogoImagePath { get; set; }

}