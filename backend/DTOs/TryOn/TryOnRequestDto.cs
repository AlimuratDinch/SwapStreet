using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public class TryOnRequestDto
{
    [Required(ErrorMessage = "Clothing image URL is required")]
    public string ClothingImageUrl { get; set; } = default!;

    [Required(ErrorMessage = "ListingId is required")]
    public Guid ListingId { get; set; }
}