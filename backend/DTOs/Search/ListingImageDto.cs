using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Search
{
    /// <summary>
    /// Lightweight image DTO for search results containing only essential display information.
    /// </summary>
    public class ListingImageDto
    {
        [Required]
        public string ImageUrl { get; set; } = string.Empty;

        [Required]
        public int DisplayOrder { get; set; }
    }
}