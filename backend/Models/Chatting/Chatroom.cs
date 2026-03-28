using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Chatroom
{

    [Key]
    public Guid Id { get; set; }

    public DateTimeOffset? CreationTime { get; set; }

    [ForeignKey("SellerId")]
    public Profile? Seller { get; set; }

    [Required]
    public Guid SellerId { get; set; }

    [ForeignKey("BuyerId")]
    public Profile? Buyer { get; set; }

    [Required]
    public Guid BuyerId { get; set; }

    [ForeignKey("ListingId")]
    public Listing? Listing { get; set; }

    public Guid? ListingId { get; set; }

    [StringLength(512)]
    public string? ListingImageSnapshotPath { get; set; }

    public bool IsDealClosed { get; set; } = false;

    public DateTimeOffset? ClosedAt { get; set; }

    public bool IsArchived { get; set; } = false;

    public DateTimeOffset? ArchivedAt { get; set; }

    public bool IsFrozen { get; set; } = false;

    [StringLength(255)]
    public string? FrozenReason { get; set; }

    public Guid? CloseRequestedById { get; set; }

    public DateTimeOffset? CloseRequestedAt { get; set; }

    public bool CloseConfirmedBySeller { get; set; } = false;

    public bool CloseConfirmedByBuyer { get; set; } = false;

    public ICollection<Message> Messages { get; set; } = new List<Message>();
    public ICollection<ChatRating> Ratings { get; set; } = new List<ChatRating>();
}
