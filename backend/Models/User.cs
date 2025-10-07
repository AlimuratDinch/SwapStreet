namespace backend.Models;

public class User
{
    public int Id { get; set; }           // Primary key
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string PhoneNumber { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public bool Verified { get; set; } = false;
    public float Rating { get; set; } = 0.0f;
    public string ProfilePictureUrl { get; set; } = "";
    public string Bio { get; set; } = "";
    public string Location { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Enum.Status Status { get; set; } = Enum.Status.Active;
    public ICollection<Rating> RatingsReceived { get; set; } = new List<Rating>();
    public ICollection<Rating> RatingsGiven { get; set; } = new List<Rating>();
    public ICollection<Listing> Listings { get; set; } = new List<Listing>();
    public ICollection<ChatRoom> ChatRooms { get; set; } = new List<ChatRoom>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();

}
    
