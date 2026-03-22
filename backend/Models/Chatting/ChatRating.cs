using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class ChatRating
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ChatroomId { get; set; }

    [ForeignKey("ChatroomId")]
    public Chatroom? Chatroom { get; set; }

    [Required]
    public Guid ReviewerId { get; set; }

    [ForeignKey("ReviewerId")]
    public Profile? Reviewer { get; set; }

    [Required]
    public Guid RevieweeId { get; set; }

    [ForeignKey("RevieweeId")]
    public Profile? Reviewee { get; set; }

    [Range(1, 5)]
    public int Stars { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
