using System;
using System.Collections.Generic;
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
    private readonly Mock<ILogger<Partition>> _mockLogger;
    private readonly TimeSpan _defaultRetention = TimeSpan.FromMinutes(5);

    public PartitionTests()
    {
        // Setup: Create a unique directory for each test
        _testPath = Path.Combine(Path.GetTempPath(), "PartitionTests_" + Guid.NewGuid().ToString());
        Directory.CreateDirectory(_testPath);
        _mockLogger = new Mock<ILogger<Partition>>();
    }

    [Fact]
    public async Task AppendAsync_ShouldReturnIncrementalOffsets()
    {
        // Arrange
        using var sut = new Partition(1, _testPath, true, _mockLogger.Object, _defaultRetention);
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
        using var sut = new Partition(1, _testPath, true, _mockLogger.Object, _defaultRetention);
        var originalString = "SwapStreet Listing Data";
        var data = Encoding.UTF8.GetBytes(originalString);

        // Act
        var offset = await sut.AppendAsync(data);
        var result = await sut.ReadAsync(offset);

        // Assert
        Encoding.UTF8.GetString(result).Should().Be(originalString);
    }

    [Fact]
    public async Task RollOver_ShouldCreateNewFile_WhenMaxFileSizeExceeded()
    {
        // Arrange: Set max file size very small to force rollover
        int maxBytes = 20; 
        using var sut = new Partition(1, _testPath, true, _mockLogger.Object, _defaultRetention, maxBytes);
        var data = Encoding.UTF8.GetBytes("This is more than 20 bytes including headers");

        // Act
        await sut.AppendAsync(data); // This should trigger a rollover for the NEXT message
        await sut.AppendAsync(data);

        // Assert: Check if second segment file exists (00001.log)
        var files = Directory.GetFiles(_testPath, "*.log");
        files.Length.Should().BeGreaterThanOrEqualTo(2);
    }

    [Fact]
    public async Task RecoverIndex_ShouldHandleAppRestart()
    {
        // Arrange: Write data and dispose
        var data = Encoding.UTF8.GetBytes("Persistent Data");
        using (var sut1 = new Partition(1, _testPath, true, _mockLogger.Object, _defaultRetention))
        {
            await sut1.AppendAsync(data);
        }

        // Act: Re-open with a new instance
        using var sut2 = new Partition(1, _testPath, true, _mockLogger.Object, _defaultRetention);
        var result = await sut2.ReadAsync(0);

        // Assert
        Encoding.UTF8.GetString(result).Should().Be("Persistent Data");
        sut2.CurrentOffset.Should().Be(1);
    }

    [Fact]
    public async Task ReadBatchAsync_ShouldReturnRequestedNumberOfMessages()
    {
        // Arrange
        using var sut = new Partition(1, _testPath, true, _mockLogger.Object, _defaultRetention);
        for (int i = 0; i < 5; i++)
        {
            await sut.AppendAsync(Encoding.UTF8.GetBytes($"Msg {i}"));
        }

        // Act
        var (messages, nextOffset) = await sut.ReadBatchAsync(0, 3);

        // Assert
        messages.Count.Should().Be(3);
        Encoding.UTF8.GetString(messages[0]).Should().Be("Msg 0");
        nextOffset.Should().Be(3);
    }

    public void Dispose()
    {
        // Cleanup: Delete files after tests
        if (Directory.Exists(_testPath))
        {
            Directory.Delete(_testPath, true);
        }
    }
}