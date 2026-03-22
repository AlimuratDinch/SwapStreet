using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace backend.DTOs.Chat
{
    public class SubmitChatRatingDto
    {
        [Required]
        [Range(1, 5, ErrorMessage = "Stars must be between 1 and 5")]
        [JsonPropertyName("stars")]
        public int Stars { get; set; }

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        [JsonPropertyName("description")]
        public string? Description { get; set; }
    }
}
