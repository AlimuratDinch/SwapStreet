using System.Text.Json.Serialization;

namespace backend.DTOs.Chat
{
    public class MessageDto
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("sendDate")]
        public DateTimeOffset? SendDate { get; set; }

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;

        [JsonPropertyName("chatroomId")]
        public Guid ChatroomId { get; set; }
    }
}
