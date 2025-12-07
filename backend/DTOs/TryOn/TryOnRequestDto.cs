using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public class TryOnRequestDto
{
    // [Required(ErrorMessage = "User image URL is required")]
    // public string UserImageUrl { get; set; } = default!;
    
    [Required(ErrorMessage = "Clothing image URL is required")]
    public string ClothingImageUrl { get; set; } = default!;

    public Guid ListingId { get; set; }
}