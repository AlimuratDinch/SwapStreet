namespace YourApp.Models;

public class TryOnImage
{
    public int Id { get; set; }
    public string UserId { get; set; }
    public string PersonalImagePath { get; set; }
    public string GeneratedImagePath { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Navigation property
    public User User { get; set; }
}