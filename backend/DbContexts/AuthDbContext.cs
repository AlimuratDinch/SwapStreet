using Microsoft.EntityFrameworkCore;
using Models.Authentication;
public class AuthDbContext : DbContext
{
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Identity> Identities { get; set; } = null!;
    public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
    public DbSet<Session> Sessions { get; set; } = null!;
    public DbSet<AuditLogEntry> AuditLogEntries { get; set; } = null!;

    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().ToTable("users", schema: "auth");
        modelBuilder.Entity<Identity>().ToTable("identities", schema: "auth");
        modelBuilder.Entity<RefreshToken>().ToTable("refresh_tokens", schema: "auth");
        modelBuilder.Entity<Session>().ToTable("sessions", schema: "auth");
        modelBuilder.Entity<AuditLogEntry>().ToTable("audit_log_entries", schema: "auth");

        // Relationships for Auth models
        modelBuilder.Entity<Identity>()
            .HasOne(i => i.User)
            .WithMany(u => u.Identities)
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RefreshToken>()
                .HasOne(r => r.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Session>()
                .HasOne(s => s.User)
                .WithMany(u => u.Sessions)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AuditLogEntry>()
            .HasOne(a => a.User)
            .WithMany(u => u.AuditLogEntries)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.SetNull);

    }
}
