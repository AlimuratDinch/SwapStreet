using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace backend.DTOs.Chat
{
    public class CreateChatroomDto
    {
        [Required(ErrorMessage = "Seller ID is required")]
        [JsonPropertyName("sellerId")]
        public Guid SellerId { get; set; }

        [Required(ErrorMessage = "Buyer ID is required")]
        [JsonPropertyName("buyerId")]
        public Guid BuyerId { get; set; }
    }
}
