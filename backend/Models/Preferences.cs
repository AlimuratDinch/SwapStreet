namespace backend.Models;

public class Preferences
{
    public int Id { get; set; }
    public bool EmailNotifications { get; set; }
    public bool SmsNotifications { get; set; }
    public string Theme { get; set; } = "Light"; // Default theme
    public Enum.Language Language { get; set; } = Enum.Language.English; // Default language
    public bool EnableLocationTracking { get; set; } = false;
    public bool EnableSustainabilityTracker { get; set; } = true;

    // Foreign key to User
    public int UserId { get; set; }
    public User User { get; set; } = null!;
}