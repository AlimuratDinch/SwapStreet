using System.ComponentModel.DataAnnotations;

public class Province
{
    // Primary Key
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(50)]
    public string Name { get; set; } = string.Empty; // e.g., "Ontario"

    [Required]
    [StringLength(2)]
    public string Code { get; set; } = string.Empty; // e.g., "ON"
}