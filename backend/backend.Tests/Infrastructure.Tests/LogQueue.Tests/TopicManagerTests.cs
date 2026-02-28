using System;
using System.IO;
using System.Threading.Tasks;
using Xunit;
using AwesomeAssertions;
using Moq;
using Microsoft.Extensions.Logging;
using backend.Infrastructure.LogQueue;

namespace LogQueue.Tests;

public class TopicManagerTests : IDisposable
{
    private readonly string _testPath;
    private readonly Mock<ILoggerFactory> _mockLoggerFactory;

    public TopicManagerTests()
    {
        // Setup: Unique directory to avoid I/O conflicts
        _testPath = Path.Combine(Path.GetTempPath(), "TopicManagerTests_" + Guid.NewGuid().ToString());
        Directory.CreateDirectory(_testPath);

        _mockLoggerFactory = new Mock<ILoggerFactory>();
        _mockLoggerFactory
            .Setup(x => x.CreateLogger(It.IsAny<string>()))
            .Returns(new Mock<ILogger>().Object);
    }

    [Fact]
    public async Task CreateTopic_ShouldCreateFolderStructure_AndStateFile()
    {
        // Arrange
        var sut = await TopicManager.InitializeAsync(_testPath, _mockLoggerFactory.Object);
        string topicName = "listings";

        // Act
        await sut.CreateTopic(topicName, 2, true, 1024, TimeSpan.FromMinutes(5));

        // Assert: Verify Folder Structure
        Directory.Exists(Path.Combine(_testPath, topicName)).Should().BeTrue();
        File.Exists(Path.Combine(_testPath, topicName, "state.json")).Should().BeTrue();
        
        // Verify Partitions folders
        Directory.Exists(Path.Combine(_testPath, topicName, $"{topicName}-0")).Should().BeTrue();
        Directory.Exists(Path.Combine(_testPath, topicName, $"{topicName}-1")).Should().BeTrue();
    }

    [Fact]
    public async Task GetTopic_ShouldReturnCorrectPartitionIndex()
    {
        // Arrange
        var sut = await TopicManager.InitializeAsync(_testPath, _mockLoggerFactory.Object);
        await sut.CreateTopic("orders", 3, true, 1024, TimeSpan.FromMinutes(1));

        // Act
        var partition = sut.GetTopic("orders", 2);

        // Assert
        partition.Should().NotBeNull();
        partition.Id.Should().Be(2);
    }

    [Fact]
    public async Task LoadTopics_ShouldRecoverState_OnInitialize()
    {
        // Arrange: Create a topic and "kill" the manager
        var firstManager = await TopicManager.InitializeAsync(_testPath, _mockLoggerFactory.Object);
        await firstManager.CreateTopic("persistent-topic", 1, true, 500, TimeSpan.FromHours(1));

        // Act: Create a brand new manager instance pointing to the same folder
        var secondManager = await TopicManager.InitializeAsync(_testPath, _mockLoggerFactory.Object);
        var partition = secondManager.GetTopic("persistent-topic", 0);

        // Assert
        partition.Should().NotBeNull();
        partition.Id.Should().Be(0);
    }

    [Fact]
    public async Task CreateTopic_ShouldSkip_IfAlreadyExists()
    {
        // Arrange
        var sut = await TopicManager.InitializeAsync(_testPath, _mockLoggerFactory.Object);
        await sut.CreateTopic("duplicate", 1, true, 1024, TimeSpan.FromMinutes(5));

        // Act
        // Attempting to create it again with different partition count
        await sut.CreateTopic("duplicate", 5, true, 1024, TimeSpan.FromMinutes(5));
        var partition = sut.GetTopic("duplicate", 4);

        // Assert: Partition 4 should be null because the second creation was skipped
        partition.Should().BeNull();
    }

    public void Dispose()
    {
        // Cleanup
        if (Directory.Exists(_testPath))
        {
            Directory.Delete(_testPath, true);
        }
    }
}