using System.Threading.Channels;

namespace backend.Infrastructure.LogQueue;

public interface ITopicManager : IDisposable
{
    /// <summary>
    /// Retrieves a specific partition for a topic. 
    /// Default index of -1 allows the manager to resolve the primary lane.
    /// </summary>
    IPartition? GetTopic(string topic, int index = -1);

    /// <summary>
    /// Creates a new topic with the specified configuration.
    /// </summary>
    Task CreateTopic(string topic, int partitionCount, bool autoFlush, int maxFileSize, TimeSpan timeSpan);

    /// <summary>
    /// Provides a direct ChannelReader for workers to listen for pulses.
    /// </summary>
    ChannelReader<bool> GetSignalReader(string topicName);

    void Dispose();
}