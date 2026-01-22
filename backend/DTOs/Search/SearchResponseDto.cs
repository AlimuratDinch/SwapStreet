using backend.Models;


namespace backend.DTOs.Search
{
    public class SearchResponseDto
    {
        public IReadOnlyList<ListingWithImagesDto> Items { get; set; } = new List<ListingWithImagesDto>();
        public string? NextCursor { get; set; }
        public bool HasNextPage { get; set; }
    }
}