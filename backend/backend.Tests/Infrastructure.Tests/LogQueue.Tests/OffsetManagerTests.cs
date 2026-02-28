using System;
using System.IO;
using System.Threading.Tasks;
using Xunit;
using AwesomeAssertions;
using backend.Infrastructure.LogQueue;

namespace LogQueue.Tests;

public class OffsetManagerTests : IDisposable
{
    private readonly string _testPath;

    public OffsetManagerTests()
    {
        // Use a unique subfolder in Temp to avoid cross-test contamination
        _testPath = Path.Combine(Path.GetTempPath(), "LogQueueTests_" + Guid.NewGuid().ToString());
        Directory.CreateDirectory(_testPath);
    }

    [Fact]
    public void GetOffset_ShouldReturnZero_WhenNoDataExists()
    {
        // Arrange
        var sut = new OffsetManager(_testPath);

        // Act
        var offset = sut.GetOffset("meilisearch", "listings", 0);

        // Assert
        offset.Should().Be(0);
    }

    [Fact]
    public async Task CommitOffset_ShouldBeRecoverable_AfterNewInstanceCreated()
    {
        // Arrange: Create first instance and commit
        var sut1 = new OffsetManager(_testPath);
        string group = "sync-group";
        string topic = "listings";
        long expectedOffset = 500;

        // Act
        await sut1.CommitOffset(group, topic, 0, expectedOffset);

        // Simulate a restart by creating a second instance pointing to the same path
        var sut2 = new OffsetManager(_testPath);
        var actualOffset = sut2.GetOffset(group, topic, 0);

        // Assert
        actualOffset.Should().Be(expectedOffset);
    }

    [Fact]
    public async Task CommitOffset_ShouldHandleSpecialCharacters_InNames()
    {
        // Arrange
        var sut = new OffsetManager(_testPath);
        string weirdGroup = "Group With Spaces & / Symbols";
        string weirdTopic = "topic.name.with.dots";

        // Act
        await sut.CommitOffset(weirdGroup, weirdTopic, 0, 123);
        
        // Re-read from a fresh instance to ensure URI escaping worked
        var sut2 = new OffsetManager(_testPath);
        var result = sut2.GetOffset(weirdGroup, weirdTopic, 0);

        // Assert
        result.Should().Be(123);
    }

    [Fact]
    public async Task CommitOffset_ShouldOverwriteValue_ForSameKey()
    {
        // Arrange
        var sut = new OffsetManager(_testPath);
        await sut.CommitOffset("g", "t", 0, 10);

        // Act
        await sut.CommitOffset("g", "t", 0, 20);
        var result = sut.GetOffset("g", "t", 0);

        // Assert
        result.Should().Be(20);
    }

    public void Dispose()
    {
        // Cleanup: Delete the test directory and its files
        if (Directory.Exists(_testPath))
        {
            Directory.Delete(_testPath, true);
        }
    }
}