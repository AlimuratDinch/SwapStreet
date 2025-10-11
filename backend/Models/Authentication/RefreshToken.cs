using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models.Authentication
{

    [Table("refresh_tokens", Schema = "auth")]
    public class RefreshToken
    {
        [Key]
        public long Id { get; set; }

        public Guid? InstanceId { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public string Token { get; set; }

        public string? UserAgent { get; set; }

        public string? DeviceId { get; set; }

        public string? Ip { get; set; }

        public bool Revoked { get; set; } = false;
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

        public DateTimeOffset? ExpiresAt { get; set; }
        public long? Parent { get; set; }

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; }
    }
}