using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Message
{
    // Primary Key
    [Key]
    public Guid Id { get; set; }

    public DateTimeOffset? SendDate { get; set; }

    public string Content { get; set; }

    [ForeignKey("ChatroomId")]
    public Chatroom? Chatroom { get; set; }

    [Required]
    public Guid ChatroomId { get; set; }

    [ForeignKey("AuthorId")]
    public Profile? Author { get; set; }

    [Required]
    public Guid AuthorId { get; set; }
}