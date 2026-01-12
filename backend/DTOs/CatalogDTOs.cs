using System.Text;
using System.Text.Json;

namespace backend.DTOs.CatalogDTOs;

// Category DTOs
public record CategoryResponse(
    int Id,
    string Name,
    IEnumerable<ItemResponse> Items
);

public record CreateCategoryRequest(string Name);
public record UpdateCategoryRequest(string Name);

// Item DTOs
public record CreateItemRequest(
    string Title,
    string Description,
    string Condition,
    decimal Price,
    string ImageUrl,
    int CategoryId
);

public record ItemResponse(
    int Id,
    string Title,
    string Description,
    string Condition,
    decimal Price,
    string ImageUrl,
    int CategoryId
);

public record UpdateItemRequest(
    string Title,
    string Description,
    string Condition,
    decimal Price,
    string ImageUrl,
    int CategoryId
);

public sealed class ListingCursor
{
    public float Rank { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid Id { get; set; }

    public string Encode()
    {
        var json = JsonSerializer.Serialize(this);
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(json));
    }

    public static bool TryDecode(string? encoded, out ListingCursor? cursor)
    {
        cursor = null;
        if (string.IsNullOrWhiteSpace(encoded)) return false;

        try
        {
            var bytes = Convert.FromBase64String(encoded);
            var json = Encoding.UTF8.GetString(bytes);
            cursor = JsonSerializer.Deserialize<ListingCursor>(json);
            return cursor != null;
        }
        catch
        {
            return false;
        }
    }
}

