using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Models.Authentication
{
    [Table("sessions", Schema = "auth")]
    public class Session
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
        public Guid? FactorId { get; set; }
        public DateTimeOffset? NotAfter { get; set; }
        public string UserAgent { get; set; }
        public string Ip { get; set; }
        public string Tag { get; set; }
        public DateTimeOffset? ConfirmedAt { get; set; }
        public DateTimeOffset? AuthenticatedAt { get; set; }
        public string AuthenticationMethod { get; set; }
        public JsonDocument AmrClaims { get; set; }
        public DateTimeOffset? DeletedAt { get; set; }

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; }
    }
}