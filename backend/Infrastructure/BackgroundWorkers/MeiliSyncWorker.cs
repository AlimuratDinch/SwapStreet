using backend.Infrastructure.LogQueue;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace backend.Infrastructure;

public class MeiliSyncWorker : BackgroundService
{
    private readonly TopicManager _topicManager;
    private readonly OffsetManager _offsetManager;
    private readonly ILogger<MeiliSyncWorker> _logger;
    
    // Configurable fields to remove hardcoding
    private readonly string _topicName;
    private readonly string _groupId;

    public MeiliSyncWorker(
        TopicManager topicManager, 
        OffsetManager offsetManager, 
        ILogger<MeiliSyncWorker> logger,
        string topicName = "listings", 
        string groupId = "meilisearch-sync")
    {
        _topicManager = topicManager;
        _offsetManager = offsetManager;
        _logger = logger;
        _topicName = topicName;
        _groupId = groupId;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Starting {WorkerName} for topic: {Topic}", nameof(MeiliSyncWorker), _topicName);

        // 1. Get the current bookmark for this specific group/topic
        long lastOffset = _offsetManager.GetOffset(_groupId, _topicName, 0);

        while (!stoppingToken.IsCancellationRequested)
        {
            try 
            {
                // 2. Locate the partition
                var partition = _topicManager.GetTopic(_topicName, 0);
                if (partition == null)
                {
                    _logger.LogWarning("Topic {Topic} not found. Waiting for initialization...", _topicName);
                    await Task.Delay(5000, stoppingToken);
                    continue;
                }

                // 3. Try to read the NEXT message
                var data = await partition.ReadAsync(lastOffset + 1);

                // 4. Logic: Send to Meilisearch
                await ProcessMeiliIndex(data);

                // 5. Success! Commit the offset
                lastOffset++;
                await _offsetManager.CommitOffset(_groupId, _topicName, 0, lastOffset);
            }
            catch (IndexOutOfRangeException) 
            {
                // Caught up with the log. Polling interval.
                await Task.Delay(1000, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Meilisearch sync failed at offset {Offset}", lastOffset);
                await Task.Delay(5000, stoppingToken); // Exponential backoff/retry delay
            }
        }
    }

    private async Task ProcessMeiliIndex(byte[] data)
    {
        // TODO: Deserialize 'data' to Listing object
        // TODO: Push to Meilisearch index (e.g., listings_index)
        await Task.CompletedTask;
    }
}