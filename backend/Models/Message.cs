namespace backend.Models;

public class Message
{
    public int Id { get; set; }           // Primary key
    public string Content { get; set; } = "";
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; } = false;
    public bool IsDelivered { get; set; } = false;

    // Foreign keys
    public int SenderId { get; set; }
    public int ReceiverId { get; set; }

    // Navigation properties
    public User Sender { get; set; } = null!;
    public User Receiver { get; set; } = null!;
}