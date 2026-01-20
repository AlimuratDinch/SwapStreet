using backend.Models;

namespace backend.DTOs.Search
{
    public class SearchRequestDto
    {
        public string? Query { get; set; }
        public int PageSize { get; set; } = 20;
        public string? Cursor { get; set; }
    }
}