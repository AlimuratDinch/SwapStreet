using System.Text;
using System.Text.Json;

namespace backend.DTOs;

public sealed class ListingCursor
{
    public double? Rank { get; set; }
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

