using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;
public class CreateListingDto
{
    [Required(ErrorMessage = "Title is required")]
    [StringLength(255, MinimumLength = 3, ErrorMessage = "Title must be 3-255 characters")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required")]
    [StringLength(1000, MinimumLength = 10, ErrorMessage = "Description must be 10-1000 characters")]
    public string Description { get; set; } = string.Empty;

    public decimal Price { get; set; } = 0.00M;

    [Required(ErrorMessage = "Profile ID is required")]
    public Guid ProfileId { get; set; }

    public Guid? TagId { get; set; }  // Optional
}