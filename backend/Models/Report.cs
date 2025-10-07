namespace backend.Models;

public class Report
{
    public int Id { get; set; } // Primary key
    public Enum.Reason Reason { get; set; }
    public string Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ReportedById { get; set; } // Foreign key to User who reported
    public int? ListingId { get; set; } // Foreign key to Listing
    public int? UserId { get; set; } // Foreign key to User
    public bool IsResolved { get; set; }

    // Navigation properties
    public User TargetUser { get; set; }
    
    public User ReportedBy { get; set; }
    public Listing Listing { get; set; }
}
   