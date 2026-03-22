using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace backend.DTOs.Chat
{
    public class CloseDealRespondDto
    {
        [Required]
        [JsonPropertyName("accept")]
        public bool Accept { get; set; }
    }
}
