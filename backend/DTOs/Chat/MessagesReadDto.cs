using System.Text.Json.Serialization;

namespace backend.DTOs.Chat
{
    public class MessagesReadDto
    {
        [JsonPropertyName("chatroomId")]
        public Guid ChatroomId { get; set; }

        [JsonPropertyName("readerId")]
        public Guid ReaderId { get; set; }

        [JsonPropertyName("readAt")]
        public DateTimeOffset ReadAt { get; set; }
    }
}