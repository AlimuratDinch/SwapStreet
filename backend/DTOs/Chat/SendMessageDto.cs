using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace backend.DTOs.Chat
{
    public class SendMessageDto
    {
        [Required(ErrorMessage = "Content is required")]
        [StringLength(5000, ErrorMessage = "Message content cannot exceed 5000 characters")]
        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;
    }
}
