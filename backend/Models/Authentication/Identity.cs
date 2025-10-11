using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace backend.Models.Authentication
{
    [Table("identities", Schema = "auth")]
    public class Identity
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        [MaxLength(255)]
        public required string Provider { get; set; }

        [Required]
        public required string IdentityData { get; set; }

        public required string ProviderId { get; set; }
        public DateTimeOffset? LastSignInAt { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

        [ForeignKey(nameof(UserId))]
        public virtual required User User { get; set; }
    }
}
