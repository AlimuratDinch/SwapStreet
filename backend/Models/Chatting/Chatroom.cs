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

    public ICollection<Message> Messages { get; set; } = new List<Message>();
}