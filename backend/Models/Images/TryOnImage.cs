using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace backend.Models;


public class TryOnImage
{
    [Key]
    public int Id { get; set; } // Convert to GUID

     [Required]
    public Guid ProfileId { get; set; } // Convert ProfileId
    public string ImagePath { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // Navigation property
    [ForeignKey("ProfileId")]
    public Profile? Profile { get; set; } // Change to Profile
}