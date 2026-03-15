using backend.DTOs;

namespace backend.Infrastructure.LogQueue;

public enum ListingAction
{
    Create,
    Update,
    Delete
}

public class ListingTaskData
{
    // Unique ID for the task (helps with idempotency)
    public Guid TaskId { get; set; } = Guid.NewGuid();

    public ListingAction Action { get; set; }

    // The actual Listing data (Title, Description, Price, etc.)
    public ListingSearchDto? SearchData { get; set; }

    // For MinIO Worker: Where the file is sitting right now, will be done later
    public string[]? TempImagePaths { get; set; }

    // For Meilisearch: The ID of the listing in the DB
    public Guid ListingId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}