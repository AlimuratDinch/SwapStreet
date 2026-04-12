using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class SustainabilityVector
{
    [Key]
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    [ForeignKey("UserId")]
    public Profile? User { get; set; }

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal CO2Kg { get; set; } = 0.0M;

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal WaterL { get; set; } = 0.0M;

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal ElectricityKWh { get; set; } = 0.0M;

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal ToxicChemicalsG { get; set; } = 0.0M;

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal LandfillKg { get; set; } = 0.0M;

    [Required]
    public int Articles { get; set; } = 0;
}