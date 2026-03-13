public class ListingSearchDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string FSA { get; set; } = string.Empty;
    public ListingSize Size { get; set; }
    public ListingCondition Condition { get; set; }
    public ListingBrand Brand { get; set; }
    public ListingColour Colour { get; set; }
    public ListingCategory Category { get; set; }

    // For Date Sorting: Use Unix timestamp or ISO8601 string
    public long CreatedAtTimestamp { get; set; }

    // For Proximity: Meilisearch reserved field name
    // Requires lat/lng from your PostGIS data
    public LatLng? _geo { get; set; }
}

public record LatLng(double lat, double lng);