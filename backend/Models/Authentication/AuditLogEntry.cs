using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models.Authentication
{
    [Table("audit_log_entries", Schema = "auth")]
    public class AuditLogEntry
    {
        [Key]
        public Guid Id { get; set; }

        public Guid? InstanceId { get; set; }
        public Guid? UserId { get; set; }

        [Required]
        public string Action { get; set; } = "";

        public string IpAddress { get; set; } = "";
        public string Payload { get; set; } = "";
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        [ForeignKey(nameof(UserId))]
        public virtual required User User { get; set; }
    }
}