using System.ComponentModel.DataAnnotations;

public class Style
{
    // Primary Key
    [Key]
    public Guid Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty; // e.g., "Bohemian", "Minimalist"
    
    [StringLength(255)]
    public string? Description { get; set; }
}