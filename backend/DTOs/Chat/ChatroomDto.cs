using System.Text.Json.Serialization;

namespace backend.DTOs.Chat
{
    public class ChatroomDto
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("creationTime")]
        public DateTimeOffset? CreationTime { get; set; }

        [JsonPropertyName("sellerId")]
        public Guid SellerId { get; set; }

        [JsonPropertyName("buyerId")]
        public Guid BuyerId { get; set; }

        [JsonPropertyName("messages")]
        public List<MessageDto> Messages { get; set; } = new List<MessageDto>();
    }
}
