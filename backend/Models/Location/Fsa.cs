using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Fsa
{
    // Primary Key
    [Key]
    public int Id { get; set; }

    // The FSA code (e.g., "M5V")
    // Fixed length of 3 is standard for Canadian FSAs
    [Required]
    [StringLength(3, MinimumLength = 3)]
    public string Code { get; set; } = string.Empty;

    // Foreign Key to City
    [Required]
    public int CityId { get; set; }

    // Navigation Property linking back to the City
    [ForeignKey("CityId")]
    public City? City { get; set; }
}