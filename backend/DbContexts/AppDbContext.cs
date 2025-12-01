using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.DbContexts;

public class AppDbContext : DbContext
{
    // --- DbSets for Core Models ---
    public DbSet<Profile> Profiles { get; set; } = null!;
    public DbSet<Listing> Listings { get; set; } = null!;
    public DbSet<Tag> Tags { get; set; } = null!;
    public DbSet<WishList> WishLists { get; set; } = null!;

    // --- DbSets for Related/Junction Tables ---
    public DbSet<ListingImage> ListingImages { get; set; } = null!;
    public DbSet<GeneratedImage> GeneratedImages { get; set; } = null!;
    public DbSet<TryOnImage> TryOnImages { get; set; } = null!;

    // --- DbSets for Lookup/Reference Tables ---
    public DbSet<City> Cities { get; set; } = null!;
    public DbSet<Province> Provinces { get; set; } = null!;
    public DbSet<ArticleType> ArticleTypes { get; set; } = null!;
    public DbSet<Size> Sizes { get; set; } = null!;
    public DbSet<Style> Styles { get; set; } = null!;
    public DbSet<Brand> Brands { get; set; } = null!;


    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // =======================================================
        // LOCATION MODELS (Lookup Tables)
        // =======================================================

        modelBuilder.Entity<Province>().ToTable("provinces");
        modelBuilder.Entity<City>().ToTable("cities");

        // Relationship: City must belong to one Province
        modelBuilder.Entity<City>()
            .HasOne(c => c.Province)
            .WithMany()
            .HasForeignKey(c => c.ProvinceId)
            .IsRequired();

        // =======================================================
        // PROFILE MODEL
        // =======================================================

        modelBuilder.Entity<Profile>().ToTable("profiles");

        // Relationship: Profile must belong to one City (CityId)
        modelBuilder.Entity<Profile>()
            .HasOne(p => p.City)
            .WithMany()
            .HasForeignKey(p => p.CityId)
            .IsRequired();

        // Define specific type for FSA
        modelBuilder.Entity<Profile>()
            .Property(p => p.FSA)
            .HasColumnType("varchar(3)");

        // Enum Conversion: ProfileStatusEnum is stored as int
        modelBuilder.Entity<Profile>()
            .Property(p => p.Status)
            .HasConversion<int>();

        modelBuilder.Entity<Profile>()
        .Property(l => l.UpdatedAt)
        .HasDefaultValueSql("NOW()")
        .ValueGeneratedOnAddOrUpdate(); // database sets UpdatedAt on insert/update

        // =======================================================
        // LOOKUP/REFERENCE TABLES
        // =======================================================

        modelBuilder.Entity<ArticleType>().ToTable("article_types");
        modelBuilder.Entity<Style>().ToTable("styles");
        modelBuilder.Entity<Brand>().ToTable("brands");

        modelBuilder.Entity<Size>().ToTable("sizes");
        modelBuilder.Entity<Size>()
            .HasOne(s => s.ArticleType)
            .WithMany()
            .HasForeignKey(s => s.ArticleTypeId);

        // =======================================================
        // TAG MODEL
        // =======================================================

        modelBuilder.Entity<Tag>().ToTable("tags");

        // Enum Conversions: Store all Tag enums as integers
        modelBuilder.Entity<Tag>()
            .Property(t => t.Color)
            .HasConversion<int>();

        modelBuilder.Entity<Tag>()
            .Property(t => t.Sex)
            .HasConversion<int>();

        modelBuilder.Entity<Tag>()
            .Property(t => t.Condition)
            .HasConversion<int>();

        // Bit Vector Conversion: MaterialEnum is stored as int
        modelBuilder.Entity<Tag>()
            .Property(t => t.Material)
            .HasConversion<int>();

        modelBuilder.Entity<Tag>()
            .Property(l => l.UpdatedAt)
            .HasDefaultValueSql("NOW()")
            .ValueGeneratedOnAddOrUpdate(); // database sets UpdatedAt on insert/update

        // =======================================================
        // LISTING MODELS
        // =======================================================

        modelBuilder.Entity<Listing>().ToTable("listings");
        modelBuilder.Entity<Listing>()
            .Property(l => l.Price)
            .HasColumnType("decimal(10,2)");


        // Relationships for Listing
        modelBuilder.Entity<Listing>()
            .HasOne(l => l.Profile) // Seller
            .WithMany()
            .HasForeignKey(l => l.ProfileId);

        modelBuilder.Entity<Listing>()
            .HasOne(l => l.Tag) // Characteristics
            .WithMany()
            .HasForeignKey(l => l.TagId);


        // =======================================================
        // JUNCTION/ASSOCIATION TABLES
        // =======================================================

        // ListingImage 
        modelBuilder.Entity<ListingImage>().ToTable("listing_images");
        modelBuilder.Entity<ListingImage>()
            .HasOne(li => li.Listing)
            .WithMany()
            .HasForeignKey(li => li.ListingId);


        modelBuilder.Entity<Listing>()
        .Property(l => l.UpdatedAt)
        .HasDefaultValueSql("NOW()")
        .ValueGeneratedOnAddOrUpdate(); // database sets UpdatedAt on insert/update

        // GeneratedImage
        modelBuilder.Entity<GeneratedImage>().ToTable("generated_images");
        modelBuilder.Entity<GeneratedImage>()
            .HasOne(gi => gi.Listing)
            .WithMany()
            .HasForeignKey(gi => gi.ListingId);

        // WishList
        modelBuilder.Entity<WishList>().ToTable("wishlists");
        modelBuilder.Entity<WishList>()
            .HasOne(wl => wl.Profile)
            .WithMany()
            .HasForeignKey(wl => wl.ProfileId);

        modelBuilder.Entity<WishList>()
            .HasOne(wl => wl.Listing)
            .WithMany()
            .HasForeignKey(wl => wl.ListingId);

        // TryOnImage
        modelBuilder.Entity<TryOnImage>().ToTable("tryon_images");
        // Note: User navigation property references User from AuthDbContext, so we don't configure the relationship here
    }
}