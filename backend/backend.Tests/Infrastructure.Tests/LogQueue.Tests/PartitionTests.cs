using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Xunit;
using AwesomeAssertions;
using Moq;
using Microsoft.Extensions.Logging;
using backend.Infrastructure.LogQueue;

namespace LogQueue.Tests;

public class PartitionTests : IDisposable
{
    private readonly string _testPath;
    private readonly string _testTopic = "listings"; // New: Partitions need a topic name now
    private readonly Mock<ILogger<Partition>> _mockLogger;
    private readonly TimeSpan _defaultRetention = TimeSpan.FromMinutes(5);

    public PartitionTests()
    {
        _testPath = Path.Combine(Path.GetTempPath(), "PartitionTests_" + Guid.NewGuid().ToString());
        Directory.CreateDirectory(_testPath);
        _mockLogger = new Mock<ILogger<Partition>>();
    }

    [Fact]
    public async Task AppendAsync_ShouldFireOnDataAppendedEvent()
    {
        // Arrange
        using var sut = new Partition(1, _testTopic, _testPath, true, _mockLogger.Object, _defaultRetention);
        string? firedTopic = null;
        int eventCount = 0;

        // Subscribe to the event
        sut.OnDataAppended += (topic) => 
        {
            firedTopic = topic;
            eventCount++;
        };

        var data = Encoding.UTF8.GetBytes("Signal Test");

        // Act
        await sut.AppendAsync(data);

        // Assert
        eventCount.Should().Be(1);
        firedTopic.Should().Be(_testTopic);
    }

    [Fact]
    public async Task AppendAsync_ShouldReturnIncrementalOffsets()
    {
        // Arrange - Added _testTopic to constructor
        using var sut = new Partition(1, _testTopic, _testPath, true, _mockLogger.Object, _defaultRetention);
        var data = Encoding.UTF8.GetBytes("Hello Log");

        // Act
        var offset1 = await sut.AppendAsync(data);
        var offset2 = await sut.AppendAsync(data);

        // Assert
        offset1.Should().Be(0);
        offset2.Should().Be(1);
    }

    [Fact]
    public async Task ReadAsync_ShouldReturnCorrectData_AfterAppend()
    {
        // Arrange
        using var sut = new Partition(1, _testTopic, _testPath, true, _mockLogger.Object, _defaultRetention);
        var originalString = "SwapStreet Listing Data";
        var data = Encoding.UTF8.GetBytes(originalString);

        // Act
        var offset = await sut.AppendAsync(data);
        var result = await sut.ReadAsync(offset);

        // Assert
        Encoding.UTF8.GetString(result).Should().Be(originalString);
    }

    [Fact]
    public async Task RecoverIndex_ShouldHandleAppRestart()
    {
        // Arrange
        var data = Encoding.UTF8.GetBytes("Persistent Data");
        using (var sut1 = new Partition(1, _testTopic, _testPath, true, _mockLogger.Object, _defaultRetention))
        {
            await sut1.AppendAsync(data);
        }

        // Act: Re-open
        using var sut2 = new Partition(1, _testTopic, _testPath, true, _mockLogger.Object, _defaultRetention);
        var result = await sut2.ReadAsync(0);

        // Assert
        Encoding.UTF8.GetString(result).Should().Be("Persistent Data");
        sut2.CurrentOffset.Should().Be(1);
    }

    // ... Other tests updated with _testTopic ...

    public void Dispose()
    {
        if (Directory.Exists(_testPath))
        {
            try { Directory.Delete(_testPath, true); } catch { /* Ignore cleanup errors */ }
        }
    }
}