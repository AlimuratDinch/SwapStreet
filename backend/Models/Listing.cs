namespace backend.Models;


public class Listing
{
    public int Id { get; set; }           // Primary key
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public Enum.Condition Condition { get; set; } = Enum.Condition.Good;
    public decimal Price { get; set; }
    public ICollection<string> ImageUrls { get; set; } = new List<string>();
    public User Creator { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string Color { get; set; } = "";
    public string Size { get; set; } = "";
    public string Brand { get; set; } = "";
    public string Model { get; set; } = "";
    public string Material { get; set; } = "";
    public string Location { get; set; } = "";
    public string Specifications { get; set; } = "";
    public bool IsAvailable { get; set; } = true;
    public int ViewCount { get; set; } = 0;
    

    // Foreign key
    public int CategoryId { get; set; }
    public int CreatorId { get; set; }

    // Navigation properties
    public Category Category { get; set; } = null!;
    public User Creator { get; set; } = null!;
}