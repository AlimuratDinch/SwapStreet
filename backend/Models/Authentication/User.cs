using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace Models.Authentication
{
    [Table("users", Schema = "auth")]
    [Index(nameof(Email), IsUnique = true)]
    [Index(nameof(Username), IsUnique = true)]
    public class User
    {
        public User()
        {
            Identities = new HashSet<Identity>();
            RefreshTokens = new HashSet<RefreshToken>();
            Sessions = new HashSet<Session>();
            AuditLogEntries = new HashSet<AuditLogEntry>();
        }

        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string Status { get; set; } = "authenticated";

        [MaxLength(255)]
        [EmailAddress]
        [Required]
        public string Email { get; set; }

        [MaxLength(255)]
        public string Username { get; set; }

        public string EncryptedPassword { get; set; }

        public DateTimeOffset? EmailConfirmedAt { get; set; }
        // public DateTimeOffset? InvitedAt { get; set; }
        // public string ConfirmationToken { get; set; }
        // public DateTimeOffset? ConfirmationSentAt { get; set; }
        // public string RecoveryToken { get; set; }
        // public DateTimeOffset? RecoverySentAt { get; set; }
        // public string EmailChange { get; set; }
        // public DateTimeOffset? EmailChangeSentAt { get; set; }
        public DateTimeOffset? LastSignInAt { get; set; } = DateTimeOffset.UtcNow;

        public bool IsAdmin { get; set; } = false;

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

        public bool IsDeleted { get; set; } = false;
        public DateTimeOffset? DeletedAt { get; set; }

        public virtual ICollection<Identity> Identities { get; set; }
        public virtual ICollection<RefreshToken> RefreshTokens { get; set; }
        public virtual ICollection<Session> Sessions { get; set; }
        public virtual ICollection<AuditLogEntry> AuditLogEntries { get; set; }

        
    }
    
    
}