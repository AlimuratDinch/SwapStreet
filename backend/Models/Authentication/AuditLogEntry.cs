
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Models.Authentication
{
[Table("audit_log_entries", Schema = "auth")]
    public class AuditLogEntry
    {
        [Key]
        public Guid Id { get; set; }

        public Guid? InstanceId { get; set; }
        public Guid? UserId { get; set; }

        [Required]
        public string Action { get; set; }

        public string IpAddress { get; set; }
        public JsonDocument Payload { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; }
    }
    }