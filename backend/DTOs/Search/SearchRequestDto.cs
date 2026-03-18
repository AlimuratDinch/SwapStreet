using backend.Models;

namespace backend.DTOs.Search;

public class SearchRequestDto
{
    public string? Query { get; set; }
    public int PageSize { get; set; } = 18;
    public string? Cursor { get; set; }

    // Filters
    public string? Category { get; set; }
    public string? Condition { get; set; }
    public string? Size { get; set; }
    public string? Brand { get; set; }

    // Location
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    public double? RadiusKm { get; set; }
}