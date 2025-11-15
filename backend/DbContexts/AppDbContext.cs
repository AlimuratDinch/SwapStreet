using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.DbContexts;

public class AppDbContext : DbContext
{
    public DbSet<Item> Items { get; set; } = null!;
    public DbSet<Category> Categories { get; set; } = null!;
    public DbSet<TryOnImage> TryOnImages { get; set; } = null!;
    public DbSet<Profile> Profiles { get; set; } = null!;
    public DbSet<Wishlist> Wishlists { get; set; } = null!;

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
        
        // Map TryOnImage to try_on_images table
        modelBuilder.Entity<TryOnImage>()
            .ToTable("try_on_images")
            .HasKey(t => t.Id);
        modelBuilder.Entity<TryOnImage>()
            .Property(t => t.Id)
            .HasColumnName("id");
        modelBuilder.Entity<TryOnImage>()
            .Property(t => t.UserId)
            .HasColumnName("user_id")
            .IsRequired();
        modelBuilder.Entity<TryOnImage>()
            .Property(t => t.PersonalImagePath)
            .HasColumnName("personal_image_path")
            .HasMaxLength(512)
            .IsRequired();
        modelBuilder.Entity<TryOnImage>()
            .Property(t => t.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();
    }
}