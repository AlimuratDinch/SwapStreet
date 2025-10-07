namespace backend.Models;

public class Notification
{
    public int Id { get; set; } // Primary key
    public int UserId { get; set; } // Foreign key to User
    public string Title { get; set; }
    public string Message { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsRead { get; set; }
    public Enum.NotificationType Type { get; set; }

    // Navigation property
    public User User { get; set; }
}