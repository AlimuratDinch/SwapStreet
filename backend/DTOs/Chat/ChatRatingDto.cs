using System.Text.Json.Serialization;

namespace backend.DTOs.Chat
{
    public class ChatRatingDto
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("chatroomId")]
        public Guid ChatroomId { get; set; }

        [JsonPropertyName("reviewerId")]
        public Guid ReviewerId { get; set; }

        [JsonPropertyName("revieweeId")]
        public Guid RevieweeId { get; set; }

        [JsonPropertyName("stars")]
        public int Stars { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("createdAt")]
        public DateTimeOffset CreatedAt { get; set; }
    }
}
