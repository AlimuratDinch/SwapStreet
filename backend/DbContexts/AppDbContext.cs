using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.DbContexts;

public class AppDbContext : DbContext
{
    public DbSet<Item> Items { get; set; } = null!;
    public DbSet<Category> Categories { get; set; } = null!;

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Map Item -> Category relationship
        modelBuilder.Entity<Item>()
            .HasOne(i => i.Category)
            .WithMany(c => c.Items)
            .HasForeignKey(i => i.CategoryId);
    }
}