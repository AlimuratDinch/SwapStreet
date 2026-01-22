using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Search
{
    /// <summary>
    /// Data transfer object that packages a listing with all its associated images.
    /// This structure makes it clear which images belong to which listing.
    /// Listing fields are flattened at the top level for easier consumption.
    /// </summary>
    public class ListingWithImagesDto
    {
        [Required]
        public Listing Listing { get; set; } = default!;

        [Required]
        public IReadOnlyList<ListingImageDto> Images { get; set; } = new List<ListingImageDto>();
    }
}
