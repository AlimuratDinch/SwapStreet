using System;
using System.IO;
using System.Threading.Tasks;
using Xunit;
using AwesomeAssertions; // Updated to match standard .Should() naming
using Moq;
using Microsoft.Extensions.Logging;
using backend.Infrastructure.LogQueue;
using System.Text;

namespace LogQueue.Tests;

public class TopicManagerTests : IDisposable
{
    private readonly string _testPath;
    private readonly Mock<ILoggerFactory> _mockLoggerFactory;
    private readonly TopicSignal _testSignal; // Shared signal for tests

    public TopicManagerTests()
    {
        _testPath = Path.Combine(Path.GetTempPath(), "TopicManagerTests_" + Guid.NewGuid().ToString());
        Directory.CreateDirectory(_testPath);

        _testSignal = new TopicSignal(); // Create a real signal for testing interactions

        _mockLoggerFactory = new Mock<ILoggerFactory>();
        _mockLoggerFactory
            .Setup(x => x.CreateLogger(It.IsAny<string>()))
            .Returns(new Mock<ILogger>().Object);
    }

    [Fact]
    public async Task CreateTopic_ShouldCreateFolderStructure_AndRegisterSignal()
    {
        // Arrange
        var sut = await TopicManager.InitializeAsync(_testPath, _testSignal, _mockLoggerFactory.Object);
        string topicName = "listings";

        // Act
        await sut.CreateTopic(topicName, 2, true, 1024, TimeSpan.FromMinutes(5));

        // Assert: Verify Folder Structure
        Directory.Exists(Path.Combine(_testPath, topicName)).Should().BeTrue();
        
        // Verify GetSignalReader works (proves AddTopic was called in Signal)
        var reader = sut.GetSignalReader(topicName);
        reader.Should().NotBeNull();
    }

    [Fact]
    public async Task AppendData_ShouldPulseSignal_ViaEventWiring()
    {
        // Arrange
        var sut = await TopicManager.InitializeAsync(_testPath, _testSignal, _mockLoggerFactory.Object);
        string topicName = "reactive-topic";
        await sut.CreateTopic(topicName, 1, true, 1024, TimeSpan.FromMinutes(5));
        
        var partition = sut.GetTopic(topicName, 0);
        var reader = sut.GetSignalReader(topicName);
        var data = Encoding.UTF8.GetBytes("Test Pulse");

        // Act
        await partition.AppendAsync(data);

        // Assert: Verify the signal was pulsed
        // WaitToReadAsync should return true immediately because AppendAsync pulsed it
        bool hasData = await reader.WaitToReadAsync(new System.Threading.CancellationTokenSource(100).Token);
        hasData.Should().BeTrue();
    }

    [Fact]
    public async Task LoadTopics_ShouldReWireEvents_OnInitialize()
    {
        // Arrange: Create data and close manager
        var firstManager = await TopicManager.InitializeAsync(_testPath, _testSignal, _mockLoggerFactory.Object);
        await firstManager.CreateTopic("persistent", 1, true, 500, TimeSpan.FromHours(1));
        
        // Act: Start second manager (simulating app restart)
        var secondSignal = new TopicSignal();
        var secondManager = await TopicManager.InitializeAsync(_testPath, secondSignal, _mockLoggerFactory.Object);
        
        var partition = secondManager.GetTopic("persistent", 0);
        var reader = secondManager.GetSignalReader("persistent");
        
        await partition.AppendAsync(Encoding.UTF8.GetBytes("Data after restart"));

        // Assert: Verify event wiring was restored
        bool hasData = await reader.WaitToReadAsync(new System.Threading.CancellationTokenSource(100).Token);
        hasData.Should().BeTrue();
    }

    [Fact]
    public async Task GetTopic_ShouldReturnCorrectPartitionIndex()
    {
        // Arrange - Note the addition of _testSignal
        var sut = await TopicManager.InitializeAsync(_testPath, _testSignal, _mockLoggerFactory.Object);
        await sut.CreateTopic("orders", 3, true, 1024, TimeSpan.FromMinutes(1));

        // Act
        var partition = sut.GetTopic("orders", 2);

        // Assert
        partition.Should().NotBeNull();
        partition.Id.Should().Be(2);
    }

    public void Dispose()
    {
        if (Directory.Exists(_testPath))
        {
            try { Directory.Delete(_testPath, true); } catch { /* Ignore */ }
        }
    }
}