using backend.Models;


namespace backend.DTOs.Search
{
    public class SearchResponseDto
    {
        public IReadOnlyList<Listing> Items { get; set; } = new List<Listing>();
        public string? NextCursor { get; set; }
        public bool HasNextPage { get; set; }
    }
}