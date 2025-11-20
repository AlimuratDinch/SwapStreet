using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.DbContexts;

public class AppDbContext : DbContext
{
    public DbSet<Item> Items { get; set; } = null!;
    public DbSet<Category> Categories { get; set; } = null!;
    public DbSet<Profile> Profiles { get; set; } = null!;
    public DbSet<Wishlist> Wishlists { get; set; } = null!;
    public DbSet<Listing> Listings { get; set; } = null!;
    public DbSet<Tag> Tags { get; set; } = null!;

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Map Category to categories table
        modelBuilder.Entity<Category>()
            .ToTable("categories")
            .HasKey(c => c.Id);
        modelBuilder.Entity<Category>()
            .Property(c => c.Id)
            .HasColumnName("id");
        modelBuilder.Entity<Category>()
            .Property(c => c.Name)
            .HasColumnName("name")
            .HasMaxLength(50)
            .IsRequired();
        
        // XXX: Remove once someone refactors the frontend to use 
        // `Listing` instead of `Item`
        // Map Item to items table
        modelBuilder.Entity<Item>()
            .ToTable("items")
            .HasKey(i => i.Id);
        modelBuilder.Entity<Item>()
            .Property(i => i.Id)
            .HasColumnName("id");
        modelBuilder.Entity<Item>()
            .Property(i => i.Title)
            .HasColumnName("title")
            .HasMaxLength(255)
            .IsRequired();
        modelBuilder.Entity<Item>()
            .Property(i => i.Description)
            .HasColumnName("description");
        modelBuilder.Entity<Item>()
            .Property(i => i.Condition)
            .HasColumnName("condition")
            .HasMaxLength(50);
        modelBuilder.Entity<Item>()
            .Property(i => i.Price)
            .HasColumnName("price")
            .HasColumnType("decimal(10,2)");
        modelBuilder.Entity<Item>()
            .Property(i => i.ImageUrl)
            .HasColumnName("image_url")
            .HasMaxLength(512);
        modelBuilder.Entity<Item>()
            .Property(i => i.CategoryId)
            .HasColumnName("category_id");
        modelBuilder.Entity<Item>()
            .HasOne(i => i.Category)
            .WithMany(c => c.Items)
            .HasForeignKey(i => i.CategoryId);
        
        // Map `Listing` to table
        modelBuilder.Entity<Listing>()
            .ToTable("listings")
            .HasKey(l => l.Id);
        modelBuilder.Entity<Listing>()
            .Property(l => l.Id)
            .HasColumnName("id");
        modelBuilder.Entity<Listing>()
            .Property(l => l.Name)
            .HasColumnName("name")
            .HasMaxLength(255);
        modelBuilder.Entity<Listing>()
            .Property(l => l.Price)
            .HasColumnName("price");
        modelBuilder.Entity<Listing>()
            .Property(l => l.Description)
            .HasColumnName("description")
            .HasMaxLength(32767);
        modelBuilder.Entity<Listing>()
            .Property(l => l.ProfileId)
            .HasColumnName("profile_id");
        modelBuilder.Entity<Listing>()
            .Property(l => l.TagId)
            .HasColumnName("tag_id");
        
        // Foreign keys for `Listing`
        modelBuilder.Entity<Listing>()
            .HasOne(l => l.Profile)
            .WithMany(p => p.Listings)
            .HasForeignKey(l => l.ProfileId);
        modelBuilder.Entity<Listing>()
            .HasOne(l => l.Tag)
            .WithOne(t => t.Listing)
            .HasForeignKey<Listing>(l => l.TagId);
        
        // Profile
        modelBuilder.Entity<Profile>()
            .ToTable("profiles")
            .HasKey(p => p.Id);
        modelBuilder.Entity<Profile>()
            .Property(p => p.Id)
            .HasColumnName("id");
        
        // Tag
        modelBuilder.Entity<Tag>()
            .ToTable("tags")
            .HasKey(t => t.Id);
        modelBuilder.Entity<Tag>()
            .Property(t => t.Id)
            .HasColumnName("id");
    }
}