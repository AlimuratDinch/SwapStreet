using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

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


    // Add for PostGIS radius search
    [Required]
    [Column(TypeName = "geography(Point,4326)")]
    public Point Centroid { get; set; } = default!;

    // Foreign Key to City
    [Required]
    public int CityId { get; set; }

    // Navigation Property linking back to the City
    [ForeignKey("CityId")]
    public City? City { get; set; }
}