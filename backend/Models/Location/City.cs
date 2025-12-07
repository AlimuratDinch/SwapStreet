using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class City
{
    // Primary Key
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(50)]
    public string Name { get; set; } = string.Empty; // e.g., "Toronto"

    // Foreign Key to Province
    [Required]
    public int ProvinceId { get; set; }

    [ForeignKey("ProvinceId")]
    public Province? Province { get; set; }

    public double Latitude { get; set; }
    public double Longitude { get; set; }

    public ICollection<Fsa> Fsas { get; set; } = new List<Fsa>();
}
