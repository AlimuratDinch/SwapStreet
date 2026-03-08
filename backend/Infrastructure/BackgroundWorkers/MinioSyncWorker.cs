using backend.Infrastructure.LogQueue;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace backend.Infrastructure;

public class MinioSyncWorker : BackgroundService
{
    private readonly ITopicManager _topicManager;
    private readonly OffsetManager _offsetManager;
    private readonly ILogger<MinioSyncWorker> _logger;

    // Configurable via Program.cs
    private readonly string _topicName;
    private readonly string _groupId;

    public MinioSyncWorker(
        ITopicManager topicManager,
        OffsetManager offsetManager,
        ILogger<MinioSyncWorker> logger,
        string topicName = "listings", // Default to listings for SwapStreet
        string groupId = "minio-sync")
    {
        _topicManager = topicManager;
        _offsetManager = offsetManager;
        _logger = logger;
        _topicName = topicName;
        _groupId = groupId;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Starting {WorkerName} for topic: {Topic}", nameof(MinioSyncWorker), _topicName);

        // 1. Ask for the bookmark
        long lastOffset = _offsetManager.GetOffset(_groupId, _topicName, 0);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // 2. Fetch the partition and next message
                var partition = _topicManager.GetTopic(_topicName, 0);
                if (partition == null)
                {
                    _logger.LogWarning("Topic {Topic} not found. Retrying...", _topicName);
                    await Task.Delay(5000, stoppingToken);
                    continue;
                }

                var data = await partition.ReadAsync(lastOffset + 1);

                // 3. Process (MinIO logic)
                await ProcessMinioUpload(data);

                // 4. Update bookmark
                lastOffset++;
                await _offsetManager.CommitOffset(_groupId, _topicName, 0, lastOffset);
            }
            catch (IndexOutOfRangeException)
            {
                // Caught up! Wait for the WebAPI to produce more logs
                await Task.Delay(2000, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "MinIO sync failed at offset {Offset}", lastOffset);
                await Task.Delay(5000, stoppingToken); // Back off to avoid spamming errors
            }
        }
    }

    private async Task ProcessMinioUpload(byte[] data)
    {
        // TODO: Use System.Text.Json to get the temp path
        // var event = JsonSerializer.Deserialize<ListingEvent>(data);
        // await _minioClient.PutObjectAsync(...);
        // File.Delete(event.TempPath);
        await Task.CompletedTask;
    }
}