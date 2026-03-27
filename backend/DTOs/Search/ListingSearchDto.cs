using System.Text.Json.Serialization;

public class ListingSearchDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("fsa")]
    public string FSA { get; set; } = string.Empty;

    [JsonPropertyName("price")]
    public decimal Price { get; set; }


    [JsonPropertyName("size")]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ListingSize Size { get; set; }

    [JsonPropertyName("condition")]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ListingCondition Condition { get; set; }

    [JsonPropertyName("colour")]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ListingColour Colour { get; set; }

    [JsonPropertyName("brand")]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ListingBrand Brand { get; set; }

    [JsonPropertyName("category")]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ListingCategory Category { get; set; }

    [JsonPropertyName("createdAtTimestamp")]
    public long CreatedAtTimestamp { get; set; }

    public LatLng? _geo { get; set; }
}

public record LatLng(double lat, double lng);