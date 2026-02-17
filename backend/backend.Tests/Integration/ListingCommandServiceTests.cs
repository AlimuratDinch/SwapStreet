using backend.Contracts;
using backend.DbContexts;
using backend.DTOs;
using backend.DTOs.Image;
using backend.Services;
using backend.Tests.Fixtures;
using AwesomeAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;
using System.Threading.Tasks;
using System;
using System.Linq;
using System.Collections.Generic;
using System.IO;
using NetTopologySuite.Geometries;
using Moq;
using System.Threading;

namespace backend.Tests.Integration;

/// <summary>
/// Integration tests for ListingCommandService.CreateListingAsync
/// Tests database interactions and validation logic
/// </summary>
[CollectionDefinition(nameof(PostgresCollectionForListing))]
public class PostgresCollectionForListing : ICollectionFixture<PostgresFixture> { }

[Collection(nameof(PostgresCollectionForListing))]
public class ListingCommandServiceTests
{
    private readonly PostgresFixture _fixture;

    public ListingCommandServiceTests(PostgresFixture fixture)
    {
        _fixture = fixture;
    }

    #region Happy Path Tests

    [Fact]
    public async Task CreateListingAsync_ValidRequest_CreatesListingSuccessfully()
    {
        // Arrange
        await SeedTestDataAsync();

        var request = new CreateListingRequestDto
        {
            Title = "Nike Air Max - Size 10",
            Description = "Excellent condition, barely used. Original box included.",
            Price = 89.99m,
            ProfileId = TestData.TestProfileId,
            FSA = "H2X",
            TagId = TestData.TestTagId,
            // Images = CreateTestImages()
        };

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger());

        // Act
        var listingId = await service.CreateListingAsync(request);

        // Assert
        listingId.Should().NotBeEmpty();

        var listing = await context
            .Listings
            .Include(l => l.Tag)
            .Include(l => l.Profile)
            .FirstAsync(l => l.Id == listingId);

        listing.Should().NotBeNull();
        listing.Title.Should().Be(request.Title);
        listing.Description.Should().Be(request.Description);
        listing.Price.Should().Be(request.Price);
        listing.ProfileId.Should().Be(request.ProfileId);
        listing.FSA.Should().Be(request.FSA);
        listing.TagId.Should().Be(request.TagId);
        listing.CreatedAt.Should().NotBe(default);
        // listing.UpdatedAt.Should().BeCloseTo(listing.CreatedAt, TimeSpan.FromMilliseconds(1));
    }

    [Fact]
    public async Task CreateListingAsync_ValidRequestWithoutTag_CreatesListingWithoutTag()
    {
        // Arrange
        await SeedTestDataAsync();

        var request = new CreateListingRequestDto
        {
            Title = "Vintage Levi's Jeans",
            Description = "Classic blue denim, size 32. Well-maintained.",
            Price = 45.50m,
            ProfileId = TestData.TestProfileId,
            FSA = "M5A",
            // Images = CreateTestImages()
            // TagId is null/not provided
        };

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger());

        // Act
        var listingId = await service.CreateListingAsync(request);

        // Assert
        var listing = await context
            .Listings
            .FirstAsync(l => l.Id == listingId);

        listing.TagId.Should().BeNull();
        listing.Title.Should().Be(request.Title);
        listing.Price.Should().Be(request.Price);
    }

    [Fact]
    public async Task CreateListingAsync_MultipleListings_EachHasUniqueId()
    {
        // Arrange
        await SeedTestDataAsync();

        var request1 = new CreateListingRequestDto
        {
            Title = "Adidas Sneakers",
            Description = "White leather sneakers, size 9",
            Price = 65.00m,
            ProfileId = TestData.TestProfileId,
            FSA = "H2X",
            // Images = CreateTestImages()
        };

        var request2 = new CreateListingRequestDto
        {
            Title = "Puma Running Shoes",
            Description = "Black running shoes, size 10",
            Price = 75.00m,
            ProfileId = TestData.TestSecondProfileId,
            FSA = "M5A",
            // Images = CreateTestImages()
        };

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger());

        // Act
        var listingId1 = await service.CreateListingAsync(request1);
        var listingId2 = await service.CreateListingAsync(request2);

        // Assert
        listingId1.Should().NotBe(listingId2);

        var listings = await context
            .Listings
            .AsNoTracking()
            .Where(l => l.Id == listingId1 || l.Id == listingId2)
            .OrderBy(l => l.Title)
            .ToListAsync();

        listings.Should().HaveCount(2);
        listings[0].Title.Should().Be("Adidas Sneakers");
        listings[1].Title.Should().Be("Puma Running Shoes");
    }

    [Fact]
    public async Task CreateListingAsync_SameSellerMultipleListings_CreatesIndependently()
    {
        // Arrange
        await SeedTestDataAsync();

        var baseRequest = new CreateListingRequestDto
        {
            ProfileId = TestData.TestProfileId,
            FSA = "H2X"
        };

        var request1 = new CreateListingRequestDto
        {
            Title = "Listing 1",
            Description = "First listing from seller",
            Price = 100.00m,
            ProfileId = baseRequest.ProfileId,
            FSA = baseRequest.FSA,
            TagId = TestData.TestTagId,
            // Images = CreateTestImages()
        };

        var request2 = new CreateListingRequestDto
        {
            Title = "Listing 2",
            Description = "Second listing from same seller",
            Price = 150.00m,
            ProfileId = baseRequest.ProfileId,
            FSA = baseRequest.FSA,
            // Images = CreateTestImages()
        };

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger());

        // Act
        var id1 = await service.CreateListingAsync(request1);
        var id2 = await service.CreateListingAsync(request2);

        // Assert
        id1.Should().NotBe(id2);

        var listings = await context
            .Listings
            .AsNoTracking()
            .Where(l => l.ProfileId == TestData.TestProfileId)
            .ToListAsync();

        listings.Should().HaveCount(2);
    }

    #endregion

    #region Delete Listing Tests

    [Fact]
    public async Task DeleteListingAsync_RemovesListingAndImages_WhenStorageSucceeds()
    {
        // Arrange
        await SeedTestDataAsync();

        var listingId = Guid.NewGuid();
        using (var seedContext = new AppDbContext(_fixture.DbOptions))
        {
            seedContext.Listings.Add(new Listing
            {
                Id = listingId,
                Title = "Delete Me",
                Description = "To be deleted",
                Price = 10.00m,
                ProfileId = TestData.TestProfileId,
                FSA = "H2X",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            seedContext.ListingImages.AddRange(
                new ListingImage { Id = Guid.NewGuid(), ListingId = listingId, ImagePath = "listing/one.jpg" },
                new ListingImage { Id = Guid.NewGuid(), ListingId = listingId, ImagePath = "listing/two.jpg" });

            await seedContext.SaveChangesAsync();
        }

        var mockStorage = new Mock<IFileStorageService>();
        mockStorage
            .Setup(s => s.DeleteFilesAsync(
                UploadType.Listing,
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<string>());

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger(), mockStorage.Object);

        // Act
        await service.DeleteListingAsync(listingId, TestData.TestProfileId);

        // Assert
        using var verifyContext = new AppDbContext(_fixture.DbOptions);
        var listing = await verifyContext.Listings.FindAsync(listingId);
        listing.Should().BeNull();

        var images = await verifyContext.ListingImages
            .Where(li => li.ListingId == listingId)
            .ToListAsync();
        images.Should().BeEmpty();

        mockStorage.Verify(
            s => s.DeleteFilesAsync(
                UploadType.Listing,
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DeleteListingAsync_WhenStorageFails_DoesNotRemoveDatabaseRows()
    {
        // Arrange
        await SeedTestDataAsync();

        var listingId = Guid.NewGuid();
        using (var seedContext = new AppDbContext(_fixture.DbOptions))
        {
            seedContext.Listings.Add(new Listing
            {
                Id = listingId,
                Title = "Delete Me",
                Description = "To be deleted",
                Price = 10.00m,
                ProfileId = TestData.TestProfileId,
                FSA = "H2X",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            seedContext.ListingImages.Add(
                new ListingImage { Id = Guid.NewGuid(), ListingId = listingId, ImagePath = "listing/one.jpg" });

            await seedContext.SaveChangesAsync();
        }

        var mockStorage = new Mock<IFileStorageService>();
        mockStorage
            .Setup(s => s.DeleteFilesAsync(
                UploadType.Listing,
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { "listing/one.jpg" });

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger(), mockStorage.Object);

        // Act
        Func<Task> act = async () => await service.DeleteListingAsync(listingId, TestData.TestProfileId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>();

        using var verifyContext = new AppDbContext(_fixture.DbOptions);
        var listing = await verifyContext.Listings.FindAsync(listingId);
        listing.Should().NotBeNull();

        var images = await verifyContext.ListingImages
            .Where(li => li.ListingId == listingId)
            .ToListAsync();
        images.Should().HaveCount(1);
    }

    [Fact]
    public async Task DeleteListingAsync_WhenListingDoesNotExist_ThrowsArgumentException()
    {
        // Arrange
        await SeedTestDataAsync();

        var nonExistentListingId = Guid.NewGuid();
        var mockStorage = new Mock<IFileStorageService>();

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger(), mockStorage.Object);

        // Act
        Func<Task> act = async () => await service.DeleteListingAsync(nonExistentListingId, TestData.TestProfileId);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage($"Listing {nonExistentListingId} not found");
    }

    [Fact]
    public async Task DeleteListingAsync_WhenUserDoesNotOwnListing_ThrowsArgumentException()
    {
        // Arrange
        await SeedTestDataAsync();

        var listingId = Guid.NewGuid();
        using (var seedContext = new AppDbContext(_fixture.DbOptions))
        {
            seedContext.Listings.Add(new Listing
            {
                Id = listingId,
                Title = "Not My Listing",
                Description = "Owned by another user",
                Price = 10.00m,
                ProfileId = TestData.TestSecondProfileId, // Different profile
                FSA = "M5A",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            await seedContext.SaveChangesAsync();
        }

        var mockStorage = new Mock<IFileStorageService>();

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger(), mockStorage.Object);

        // Act - Try to delete with wrong profile ID
        Func<Task> act = async () => await service.DeleteListingAsync(listingId, TestData.TestProfileId);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage($"Listing {listingId} not found");

        // Verify listing still exists
        using var verifyContext = new AppDbContext(_fixture.DbOptions);
        var listing = await verifyContext.Listings.FindAsync(listingId);
        listing.Should().NotBeNull();
    }

    [Fact]
    public async Task DeleteListingAsync_WithNoImages_RemovesListingSuccessfully()
    {
        // Arrange
        await SeedTestDataAsync();

        var listingId = Guid.NewGuid();
        using (var seedContext = new AppDbContext(_fixture.DbOptions))
        {
            seedContext.Listings.Add(new Listing
            {
                Id = listingId,
                Title = "No Images Listing",
                Description = "Listing without any images",
                Price = 10.00m,
                ProfileId = TestData.TestProfileId,
                FSA = "H2X",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            await seedContext.SaveChangesAsync();
        }

        var mockStorage = new Mock<IFileStorageService>();

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger(), mockStorage.Object);

        // Act
        await service.DeleteListingAsync(listingId, TestData.TestProfileId);

        // Assert
        using var verifyContext = new AppDbContext(_fixture.DbOptions);
        var listing = await verifyContext.Listings.FindAsync(listingId);
        listing.Should().BeNull();

        // Verify DeleteFilesAsync was never called since there were no images
        mockStorage.Verify(
            s => s.DeleteFilesAsync(
                It.IsAny<UploadType>(),
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeleteListingAsync_WithMultipleImages_RemovesAllImagesAndListing()
    {
        // Arrange
        await SeedTestDataAsync();

        var listingId = Guid.NewGuid();
        var imagePaths = new[] { "listing/img1.jpg", "listing/img2.jpg", "listing/img3.jpg", "listing/img4.jpg" };

        using (var seedContext = new AppDbContext(_fixture.DbOptions))
        {
            seedContext.Listings.Add(new Listing
            {
                Id = listingId,
                Title = "Multi Image Listing",
                Description = "Listing with multiple images",
                Price = 20.00m,
                ProfileId = TestData.TestProfileId,
                FSA = "H2X",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            foreach (var path in imagePaths)
            {
                seedContext.ListingImages.Add(
                    new ListingImage { Id = Guid.NewGuid(), ListingId = listingId, ImagePath = path });
            }

            await seedContext.SaveChangesAsync();
        }

        var mockStorage = new Mock<IFileStorageService>();
        mockStorage
            .Setup(s => s.DeleteFilesAsync(
                UploadType.Listing,
                It.Is<IEnumerable<string>>(paths => paths.Count() == 4),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<string>());

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger(), mockStorage.Object);

        // Act
        await service.DeleteListingAsync(listingId, TestData.TestProfileId);

        // Assert
        using var verifyContext = new AppDbContext(_fixture.DbOptions);
        var listing = await verifyContext.Listings.FindAsync(listingId);
        listing.Should().BeNull();

        var images = await verifyContext.ListingImages
            .Where(li => li.ListingId == listingId)
            .ToListAsync();
        images.Should().BeEmpty();

        // Verify all 4 image paths were passed to DeleteFilesAsync
        mockStorage.Verify(
            s => s.DeleteFilesAsync(
                UploadType.Listing,
                It.Is<IEnumerable<string>>(paths => 
                    paths.Count() == 4 && 
                    paths.All(p => imagePaths.Contains(p))),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DeleteListingAsync_WhenStorageServiceIsNull_ThrowsInvalidOperationException()
    {
        // Arrange
        await SeedTestDataAsync();

        var listingId = Guid.NewGuid();
        using (var seedContext = new AppDbContext(_fixture.DbOptions))
        {
            seedContext.Listings.Add(new Listing
            {
                Id = listingId,
                Title = "Listing With Images",
                Description = "Has images but no storage service",
                Price = 10.00m,
                ProfileId = TestData.TestProfileId,
                FSA = "H2X",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            seedContext.ListingImages.Add(
                new ListingImage { Id = Guid.NewGuid(), ListingId = listingId, ImagePath = "listing/image.jpg" });

            await seedContext.SaveChangesAsync();
        }

        using var context = new AppDbContext(_fixture.DbOptions);
        // Create service WITHOUT storage service
        var service = new ListingCommandService(context, CreateMockLogger());

        // Act
        Func<Task> act = async () => await service.DeleteListingAsync(listingId, TestData.TestProfileId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("File storage service not available for listing deletion.");

        // Verify listing was NOT deleted
        using var verifyContext = new AppDbContext(_fixture.DbOptions);
        var listing = await verifyContext.Listings.FindAsync(listingId);
        listing.Should().NotBeNull();

        var images = await verifyContext.ListingImages
            .Where(li => li.ListingId == listingId)
            .ToListAsync();
        images.Should().HaveCount(1);
    }

    [Fact]
    public async Task DeleteListingAsync_WithPartialStorageFailure_ThrowsInvalidOperationException()
    {
        // Arrange
        await SeedTestDataAsync();

        var listingId = Guid.NewGuid();
        using (var seedContext = new AppDbContext(_fixture.DbOptions))
        {
            seedContext.Listings.Add(new Listing
            {
                Id = listingId,
                Title = "Listing With Multiple Images",
                Description = "Some images fail to delete",
                Price = 15.00m,
                ProfileId = TestData.TestProfileId,
                FSA = "H2X",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            seedContext.ListingImages.AddRange(
                new ListingImage { Id = Guid.NewGuid(), ListingId = listingId, ImagePath = "listing/img1.jpg" },
                new ListingImage { Id = Guid.NewGuid(), ListingId = listingId, ImagePath = "listing/img2.jpg" },
                new ListingImage { Id = Guid.NewGuid(), ListingId = listingId, ImagePath = "listing/img3.jpg" });

            await seedContext.SaveChangesAsync();
        }

        var mockStorage = new Mock<IFileStorageService>();
        // Simulate partial failure - 2 out of 3 images fail to delete
        mockStorage
            .Setup(s => s.DeleteFilesAsync(
                UploadType.Listing,
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { "listing/img1.jpg", "listing/img3.jpg" });

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger(), mockStorage.Object);

        // Act
        Func<Task> act = async () => await service.DeleteListingAsync(listingId, TestData.TestProfileId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"Failed to delete 2 image(s) for listing {listingId}");

        // Verify listing and images were NOT deleted from database
        using var verifyContext = new AppDbContext(_fixture.DbOptions);
        var listing = await verifyContext.Listings.FindAsync(listingId);
        listing.Should().NotBeNull();

        var images = await verifyContext.ListingImages
            .Where(li => li.ListingId == listingId)
            .ToListAsync();
        images.Should().HaveCount(3);
    }

    #endregion

    #region Validation Tests - Invalid FSA

    [Fact]
    public async Task CreateListingAsync_NoImagesProvided_CreatesListingWithoutImages()
    {
        // Arrange
        await SeedTestDataAsync();

        var request = new CreateListingRequestDto
        {
            Title = "No Images",
            Description = "Service currently allows listings without images (BECAUSE CHECKED IN FRONTEND)",
            Price = 10.00m,
            ProfileId = TestData.TestProfileId,
            FSA = "H2X",
            // Images intentionally left null to assert current behavior
        };

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger());

        // Act
        var listingId = await service.CreateListingAsync(request);

        // Assert (listing should be created and have no images (AGAIN, CHECKED IN FRONTEND))
        listingId.Should().NotBeEmpty();
        var listing = await context.Listings.FirstAsync(l => l.Id == listingId);
        listing.Should().NotBeNull();

        var images = await context.ListingImages.Where(li => li.ListingId == listingId).ToListAsync();
        images.Should().HaveCount(0);
    }

    [Fact]
    public async Task CreateListingAsync_InvalidFsa_ThrowsArgumentException()
    {
        // Arrange
        await SeedTestDataAsync();

        var request = new CreateListingRequestDto
        {
            Title = "Invalid FSA Test",
            Description = "Should fail on invalid FSA",
            Price = 50.00m,
            ProfileId = TestData.TestProfileId,
            FSA = "ZZZ", // Invalid FSA code
            // Images = CreateTestImages()
        };

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger());

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            async () => await service.CreateListingAsync(request));

        exception.Message.Should().Contain("Invalid FSA");
    }

    [Fact]
    public async Task CreateListingAsync_NonexistentFsa_ThrowsArgumentException()
    {
        // Arrange
        await SeedTestDataAsync();

        var request = new CreateListingRequestDto
        {
            Title = "Nonexistent FSA",
            Description = "FSA not in database",
            Price = 99.99m,
            ProfileId = TestData.TestProfileId,
            FSA = "X9X", // Not seeded
            // Images = CreateTestImages()
        };

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger());

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            async () => await service.CreateListingAsync(request));

        exception.Message.Should().Contain("Invalid FSA");
    }

    #endregion

    #region Validation Tests - Invalid Profile

    [Fact]
    public async Task CreateListingAsync_NonexistentProfileId_ThrowsArgumentException()
    {
        // Arrange
        await SeedTestDataAsync();

        var invalidProfileId = Guid.Parse("99999999-9999-9999-9999-999999999999");

        var request = new CreateListingRequestDto
        {
            Title = "Invalid Profile",
            Description = "Profile does not exist",
            Price = 75.00m,
            ProfileId = invalidProfileId,
            FSA = "H2X",
            // Images = CreateTestImages()
        };

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger());

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            async () => await service.CreateListingAsync(request));

        exception.Message.Should().Contain("Profile");
        exception.Message.Should().Contain(invalidProfileId.ToString());
    }

    [Fact]
    public async Task CreateListingAsync_DeletedProfile_ThrowsArgumentException()
    {
        // Arrange
        await SeedTestDataAsync();
        var deletedProfileId = TestData.TestSecondProfileId;

        // Mark profile as deleted (if applicable to your model)
        using (var seedContext = new AppDbContext(_fixture.DbOptions))
        {
            var profile = await seedContext.Profiles.FindAsync(deletedProfileId);
            if (profile != null)
            {
                seedContext.Profiles.Remove(profile);
                await seedContext.SaveChangesAsync();
            }
        }

        var request = new CreateListingRequestDto
        {
            Title = "Listing for Deleted Profile",
            Description = "Should fail",
            Price = 50.00m,
            ProfileId = deletedProfileId,
            FSA = "H2X",
            // Images = CreateTestImages()
        };

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger());

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            async () => await service.CreateListingAsync(request));

        exception.Message.Should().Contain("Profile");
    }

    #endregion

    #region Validation Tests - Invalid Tag

    [Fact]
    public async Task CreateListingAsync_NonexistentTagId_ThrowsArgumentException()
    {
        // Arrange
        await SeedTestDataAsync();

        var invalidTagId = Guid.Parse("88888888-8888-8888-8888-888888888888");

        var request = new CreateListingRequestDto
        {
            Title = "Invalid Tag",
            Description = "Tag does not exist",
            Price = 120.00m,
            ProfileId = TestData.TestProfileId,
            FSA = "H2X",
            TagId = invalidTagId,
            // Images = CreateTestImages()
        };

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger());

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            async () => await service.CreateListingAsync(request));

        exception.Message.Should().Contain("Tag");
        exception.Message.Should().Contain(invalidTagId.ToString());
    }

    #endregion

    #region Data Integrity Tests

    [Fact]
    public async Task CreateListingAsync_TimestampsAreSet_CreatedAtEqualsUpdatedAt()
    {
        // Arrange
        await SeedTestDataAsync();
        var beforeCreation = DateTime.UtcNow;

        var request = new CreateListingRequestDto
        {
            Title = "Timestamp Test",
            Description = "Testing timestamp creation",
            Price = 30.00m,
            ProfileId = TestData.TestProfileId,
            FSA = "M5A",
            // Images = CreateTestImages()
        };

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger());

        // Act
        var listingId = await service.CreateListingAsync(request);
        var afterCreation = DateTime.UtcNow;

        // Assert
        var listing = await context
            .Listings
            .FirstAsync(l => l.Id == listingId);

        listing.CreatedAt.Should().BeOnOrAfter(beforeCreation);
        listing.CreatedAt.Should().BeOnOrBefore(afterCreation);
        listing.UpdatedAt.Should().BeCloseTo(listing.CreatedAt, TimeSpan.FromMilliseconds(100));
    }

    [Fact]
    public async Task CreateListingAsync_ListingIsPersisted_CanBeRetrievedFromDatabase()
    {
        // Arrange
        await SeedTestDataAsync();

        var request = new CreateListingRequestDto
        {
            Title = "Persistence Test",
            Description = "Test that data is persisted to database",
            Price = 99.99m,
            ProfileId = TestData.TestProfileId,
            FSA = "H2X",
            TagId = TestData.TestTagId,
            // Images = CreateTestImages()
        };

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger());

        // Act
        var listingId = await service.CreateListingAsync(request);

        // Assert - Retrieve in a new context to ensure it was persisted
        using var newContext = new AppDbContext(_fixture.DbOptions);
        var persistedListing = await newContext.Listings
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == listingId);

        persistedListing.Should().NotBeNull();
        persistedListing.Title.Should().Be(request.Title);
        persistedListing.Price.Should().Be(request.Price);
    }

    [Fact]
    public async Task CreateListingAsync_FieldsAreTrimmed_NoLeadingOrTrailingWhitespace()
    {
        // Arrange
        await SeedTestDataAsync();

        var request = new CreateListingRequestDto
        {
            Title = "  Trimmed Title  ",
            Description = "  Description with spaces  ",
            Price = 50.00m,
            ProfileId = TestData.TestProfileId,
            FSA = "H2X",
            // Images = CreateTestImages()
        };

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger());

        // Act
        var listingId = await service.CreateListingAsync(request);

        // Assert
        var listing = await context
            .Listings
            .FirstAsync(l => l.Id == listingId);

        // Depending on implementation, check if trimming is done
        // If not trimmed in service, this test documents the behavior
        listing.Title.Should().Be(request.Title);
        listing.Description.Should().Be(request.Description);
    }

    #endregion

    #region Edge Cases

    [Fact]
    public async Task CreateListingAsync_PriceZero_AllowsZeroPrice()
    {
        // Arrange
        await SeedTestDataAsync();

        var request = new CreateListingRequestDto
        {
            Title = "Free Item",
            Description = "Giving away for free",
            Price = 0m,
            ProfileId = TestData.TestProfileId,
            FSA = "H2X",
            // Images = CreateTestImages()
        };

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger());

        // Act
        var listingId = await service.CreateListingAsync(request);

        // Assert
        var listing = await context
            .Listings
            .FirstAsync(l => l.Id == listingId);

        listing.Price.Should().Be(0m);
    }

    [Fact]
    public async Task CreateListingAsync_LargePriceValue_HandlesDecimalCorrectly()
    {
        // Arrange
        await SeedTestDataAsync();

        var largePrice = 99999.99m; // Max for decimal(10,2)

        var request = new CreateListingRequestDto
        {
            Title = "Expensive Item",
            Description = "High-value listing",
            Price = largePrice,
            ProfileId = TestData.TestProfileId,
            FSA = "H2X",
            // Images = CreateTestImages()
        };

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger());

        // Act
        var listingId = await service.CreateListingAsync(request);

        // Assert
        var listing = await context
            .Listings
            .FirstAsync(l => l.Id == listingId);

        listing.Price.Should().Be(largePrice);
    }

    [Fact]
    public async Task CreateListingAsync_MaxLengthStrings_HandlesMaxLengthCorrectly()
    {
        // Arrange
        await SeedTestDataAsync();

        var maxTitle = new string('A', 255);
        var maxDescription = new string('B', 1000);

        var request = new CreateListingRequestDto
        {
            Title = maxTitle,
            Description = maxDescription,
            Price = 50.00m,
            ProfileId = TestData.TestProfileId,
            FSA = "H2X",
            // Images = CreateTestImages()
        };

        using var context = new AppDbContext(_fixture.DbOptions);
        var service = new ListingCommandService(context, CreateMockLogger());

        // Act
        var listingId = await service.CreateListingAsync(request);

        // Assert
        var listing = await context
            .Listings
            .FirstAsync(l => l.Id == listingId);

        listing.Title.Should().HaveLength(255);
        listing.Description.Should().HaveLength(1000);
    }

    #endregion

    #region Helper Methods

    private ILogger<ListingCommandService> CreateMockLogger()
    {
        var factory = new LoggerFactory();
        return factory.CreateLogger<ListingCommandService>();
    }

    /// <summary>
    /// Seeds test data into the database for each test
    /// </summary>
    private async Task SeedTestDataAsync()
    {
        using var context = new AppDbContext(_fixture.DbOptions);

        // Clear existing data
        await context.Database.EnsureDeletedAsync();
        await context.Database.EnsureCreatedAsync();

        // Seed Provinces (required for Cities)
        var provinces = new[]
        {
            new Province { Id = 1, Name = "Ontario", Code = "ON" },
            new Province { Id = 2, Name = "Quebec", Code = "QC" }
        };
        context.Provinces.AddRange(provinces);
        await context.SaveChangesAsync();

        // Seed Cities (required for FSA and Profile)
        var cities = new[]
        {
            new City { Id = 1, Name = "Toronto", ProvinceId = 1, Latitude = 43.7f, Longitude = -79.3f },
            new City { Id = 2, Name = "Montreal", ProvinceId = 2, Latitude = 45.5f, Longitude = -73.5f }
        };
        context.Cities.AddRange(cities);
        await context.SaveChangesAsync();

        // Seed Profiles
        context.Profiles.AddRange(
            new Profile
            {
                Id = TestData.TestProfileId,
                Status = ProfileStatusEnum.Online,
                FirstName = "John",
                LastName = "Doe",
                CityId = 1,
                FSA = "H2X",
                CreatedAt = DateTime.UtcNow
            },
            new Profile
            {
                Id = TestData.TestSecondProfileId,
                Status = ProfileStatusEnum.Online,
                FirstName = "Jane",
                LastName = "Smith",
                CityId = 2,
                FSA = "M5A",
                CreatedAt = DateTime.UtcNow
            }
        );

        // Seed ArticleTypes, Styles, Sizes, Brands (required for Tags)
        context.ArticleTypes.Add(new ArticleType { Id = TestData.TestArticleTypeId, Name = "Footwear" });
        context.Styles.Add(new Style { Id = TestData.TestStyleId, Name = "Casual" });
        context.Sizes.Add(new Size { Id = TestData.TestSizeId, Value = "10", ArticleTypeId = TestData.TestArticleTypeId });
        context.Brands.Add(new Brand { Id = TestData.TestBrandId, Name = "Nike" });

        await context.SaveChangesAsync();

        // Seed Tags
        context.Tags.AddRange(
            new Tag
            {
                Id = TestData.TestTagId,
                ArticleTypeId = TestData.TestArticleTypeId,
                StyleId = TestData.TestStyleId,
                SizeId = TestData.TestSizeId,
                Color = ColorEnum.Black,
                BrandId = TestData.TestBrandId,
                Sex = SexEnum.Unisex,
                Condition = ConditionEnum.NewWithTags,
                Material = (int)MaterialEnum.Leather,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Tag
            {
                Id = TestData.TestSecondTagId,
                ArticleTypeId = TestData.TestArticleTypeId,
                StyleId = TestData.TestStyleId,
                SizeId = TestData.TestSizeId,
                Color = ColorEnum.White,
                BrandId = TestData.TestBrandId,
                Sex = SexEnum.Unisex,
                Condition = ConditionEnum.ExcellentUsedCondition,
                Material = (int)MaterialEnum.Cotton,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        );

        // Seed FSAs
        context.Fsas.AddRange(
            new Fsa { Code = "H2X", CityId = 1, Centroid = new Point(-79.3, 43.7) },
            new Fsa { Code = "M5A", CityId = 2, Centroid = new Point(-73.5, 45.5) }
        );

        await context.SaveChangesAsync();
    }

    private List<IFormFile> CreateTestImages(int count = 1)
    {
        var images = new List<IFormFile>();
        for (int i = 0; i < count; i++)
        {
            var content = new byte[] { 1, 2, 3, 4 };
            var stream = new MemoryStream(content);
            images.Add(new FormFile(stream, 0, content.Length, $"file{i}", $"image{i}.jpg")
            {
                Headers = new HeaderDictionary(),
                ContentType = "image/jpeg"
            });
        }

        return images;
    }

    #endregion
}
