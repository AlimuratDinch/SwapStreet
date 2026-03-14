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

        [JsonPropertyName("listingId")]
        public Guid? ListingId { get; set; }

        [JsonPropertyName("listingTitle")]
        public string? ListingTitle { get; set; }

        [JsonPropertyName("listingImageUrl")]
        public string? ListingImageUrl { get; set; }

        [JsonPropertyName("isDealClosed")]
        public bool IsDealClosed { get; set; }

        [JsonPropertyName("closedAt")]
        public DateTimeOffset? ClosedAt { get; set; }

        [JsonPropertyName("isArchived")]
        public bool IsArchived { get; set; }

        [JsonPropertyName("archivedAt")]
        public DateTimeOffset? ArchivedAt { get; set; }

        [JsonPropertyName("isFrozen")]
        public bool IsFrozen { get; set; }

        [JsonPropertyName("frozenReason")]
        public string? FrozenReason { get; set; }

        [JsonPropertyName("closeRequestedById")]
        public Guid? CloseRequestedById { get; set; }

        [JsonPropertyName("closeRequestedAt")]
        public DateTimeOffset? CloseRequestedAt { get; set; }

        [JsonPropertyName("closeConfirmedBySeller")]
        public bool CloseConfirmedBySeller { get; set; }

        [JsonPropertyName("closeConfirmedByBuyer")]
        public bool CloseConfirmedByBuyer { get; set; }

        [JsonPropertyName("sellerRatingAverage")]
        public double? SellerRatingAverage { get; set; }

        [JsonPropertyName("sellerRatingCount")]
        public int SellerRatingCount { get; set; }

        [JsonPropertyName("buyerRatingAverage")]
        public double? BuyerRatingAverage { get; set; }

        [JsonPropertyName("buyerRatingCount")]
        public int BuyerRatingCount { get; set; }

        [JsonPropertyName("ratings")]
        public List<ChatRatingDto> Ratings { get; set; } = new List<ChatRatingDto>();

        [JsonPropertyName("messages")]
        public List<MessageDto> Messages { get; set; } = new List<MessageDto>();
    }
}
