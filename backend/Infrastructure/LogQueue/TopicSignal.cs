using System.Collections.Concurrent;
using System.Threading.Channels;

namespace backend.Infrastructure.LogQueue;

public class TopicSignal
{
    private readonly ConcurrentDictionary<string, Channel<bool>> _channels = new();


    public void AddTopic(string topic)
    {
        if (topic is not null)
        {
            _channels.GetOrAdd(topic, _ => CreateChannel());
        }
        
    }

    // The Worker calls this once during initialization
    public ChannelReader<bool> GetReader(string topic)
    {
        var channel = _channels.GetOrAdd(topic, _ => CreateChannel());
        return channel.Reader;
    }

    public bool RemoveTopic(string topic)
    {
        if (_channels.TryRemove(topic, out var channel))
        {
            channel.Writer.TryComplete();
            return true;
        }
        return false;
    }

    // --- Core Signaling Logic ---

    public void Pulse(string topic)
    {
        var channel = _channels.GetOrAdd(topic, _ => CreateChannel());
        channel.Writer.TryWrite(true);
    }

    public async Task WaitAsync(string topic, CancellationToken ct)
    {
        var channel = _channels.GetOrAdd(topic, _ => CreateChannel());
        
        try 
        {
            if (await channel.Reader.WaitToReadAsync(ct))
            {
                channel.Reader.TryRead(out _);
            }
        }
        catch (ChannelClosedException)
        {
            // Handle the case where the topic was deleted while we were waiting
            await Task.Delay(1000, ct); 
        }
    }

    private static Channel<bool> CreateChannel() => 
        Channel.CreateBounded<bool>(new BoundedChannelOptions(1) { FullMode = BoundedChannelFullMode.DropWrite });
}