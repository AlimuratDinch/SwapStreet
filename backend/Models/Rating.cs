namespace backend.Models;

public class Rating
{
    public int Id { get; set; }           // Primary key
    public int Score { get; set; }        // Rating score (e.g., 1-5)
    public string Comment { get; set; } = ""; // Optional comment
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Foreign keys
    public int UserId { get; set; }       // The user who is being rated
    public int RaterId { get; set; }      // The user who gives the rating

    // Navigation properties
    public User User { get; set; } = null!;       // The user who is being rated
    public User Rater { get; set; } = null!;      // The user who gives the rating
}