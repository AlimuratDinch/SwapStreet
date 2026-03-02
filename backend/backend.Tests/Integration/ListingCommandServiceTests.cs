using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Linq;
using Xunit;
using AwesomeAssertions;
using Moq;
using Microsoft.Extensions.Logging;
using backend.Contracts;
using backend.DbContexts;
using backend.DTOs;
using backend.Infrastructure.LogQueue;
using backend.Services;
using backend.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace backend.Tests.Integration;

[CollectionDefinition("ListingCommandTests")]
public class ListingCommandCollection : ICollectionFixture<PostgresFixture> { }

[Collection("ListingCommandTests")]
public class ListingCommandServiceTests
{
    private readonly PostgresFixture _pgFixture;
    private readonly Mock<ITopicManager> _topicManagerMock;
    private readonly Mock<IPartition> _partitionMock;
    private readonly Mock<IFileStorageService> _fileStorageMock;
    private readonly Mock<ILocationService> _locationMock;

    // Use these constants to ensure IDs match between Seed and Request
    private static readonly Guid TestProfileId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private const string TestFsa = "H2X";

    public ListingCommandServiceTests(PostgresFixture pgFixture)
    {
        _pgFixture = pgFixture;
        _topicManagerMock = new Mock<ITopicManager>();
        _partitionMock = new Mock<IPartition>();
        _fileStorageMock = new Mock<IFileStorageService>();
        _locationMock = new Mock<ILocationService>();

        // Setup the "One Lane" mapping
        // We setup for both -1 (default) and 0 just to be safe
        _topicManagerMock.Setup(m => m.GetTopic("listings", -1)).Returns(_partitionMock.Object);
        _topicManagerMock.Setup(m => m.GetTopic("listings", 0)).Returns(_partitionMock.Object);
    }

    private ListingCommandService CreateService(AppDbContext context)
    {
        return new ListingCommandService(
            context,
            new Mock<ILogger<ListingCommandService>>().Object,
            _fileStorageMock.Object,
            _locationMock.Object,
            _topicManagerMock.Object
        );
    }

    #region Happy Path Tests

    [Fact]
    public async Task CreateListingAsync_ValidRequest_SavesToDbAndLogsToQueue()
    {
        // Arrange
        await SeedTestDataAsync();
        using var context = new AppDbContext(_pgFixture.DbOptions);
        var service = CreateService(context);

        var request = new CreateListingRequestDto
        {
            Title = "Nike Air Max - Size 10",
            Description = "Excellent condition.",
            Price = 89.99m,
            ProfileId = TestProfileId,
            FSA = TestFsa
        };

        // Capture the bytes sent to the partition
        byte[] capturedBytes = null!;
        _partitionMock
            .Setup(p => p.AppendAsync(It.IsAny<byte[]>()))
            .Callback<byte[]>(data => capturedBytes = data)
            .ReturnsAsync(1L);

        // Act
        var listingId = await service.CreateListingAsync(request);

        // Assert - 1. Database
        var listing = await context.Listings.FirstAsync(l => l.Id == listingId);
        listing.Title.Should().Be(request.Title);

        // Assert - 2. Log Queue Hand-off
        _partitionMock.Verify(p => p.AppendAsync(It.IsAny<byte[]>()), Times.Once);

        // Assert - 3. Payload Validation
        capturedBytes.Should().NotBeNull();
        var json = Encoding.UTF8.GetString(capturedBytes);
        var taskData = JsonSerializer.Deserialize<ListingTaskData>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        taskData.Should().NotBeNull();
        taskData!.ListingId.Should().Be(listingId);
        taskData.Action.Should().Be(ListingAction.Create);
    }

    #endregion

    #region Resilience Tests

    [Fact]
    public async Task CreateListingAsync_LogQueueDown_StillReturnsListingId()
    {
        // Arrange
        await SeedTestDataAsync();
        using var context = new AppDbContext(_pgFixture.DbOptions);
        var service = CreateService(context);

        // Simulate disk failure in the log queue
        _partitionMock.Setup(p => p.AppendAsync(It.IsAny<byte[]>())).ThrowsAsync(new IOException("Disk Full"));

        var request = new CreateListingRequestDto
        {
            Title = "Resilience Test",
            ProfileId = TestProfileId,
            FSA = TestFsa
        };

        // Act
        var listingId = await service.CreateListingAsync(request);

        // Assert
        listingId.Should().NotBeEmpty();
        var dbListing = await context.Listings.AnyAsync(l => l.Id == listingId);
        dbListing.Should().BeTrue();
    }

    #endregion

    #region Helper Methods

    private async Task SeedTestDataAsync()
    {
        using var context = new AppDbContext(_pgFixture.DbOptions);
        await context.Database.EnsureDeletedAsync();
        await context.Database.EnsureCreatedAsync();

        var province = new Province { Id = 1, Code = "QC", Name = "Quebec" };
        context.Provinces.Add(province);
        await context.SaveChangesAsync();

        var city = new City { Id = 1, Name = "Montreal", ProvinceId = 1 };
        context.Cities.Add(city);
        await context.SaveChangesAsync();

        // FIX: Provide a Point to satisfy the NOT NULL Centroid constraint
        context.Fsas.Add(new Fsa
        {
            Code = TestFsa,
            CityId = 1,
            Centroid = new Point(-73.5673, 45.5017) { SRID = 4326 }
        });

        context.Profiles.Add(new Profile
        {
            Id = TestProfileId,
            FirstName = "TestUser",
            LastName = "Standard",
            FSA = TestFsa,
            CityId = 1
        });

        await context.SaveChangesAsync();
    }

    #endregion
}