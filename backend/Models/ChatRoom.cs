namespace backend.Models;

public class ChatRoom
{
    public int Id { get; set; }           // Primary key
    public string Name { get; set; } = "";

    public int SellerId { get; set; }       // Foreign key to User (seller)
    public int BuyerId { get; set; }        // Foreign key to User (buyer)
    public int ListingId { get; set; }         // Foreign key to Item
    // Navigation property: one chat room has many messages
    public ICollection<Message> Messages { get; set; } = new List<Message>();

    // Navigation properties
    public User Seller { get; set; } = null!; // The seller in the
    public User Buyer { get; set; } = null!;  // The buyer in the chat
    public Listing Listing { get; set; } = null!; // The listing being discussed
    
}