using System.Text.Json;
using backend.Infrastructure.LogQueue;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RestSharp.Portable.Deserializers;
using Meilisearch;

namespace backend.Infrastructure;

public class MeiliSyncWorker : BackgroundService
{
    private readonly ITopicManager _topicManager;
    private readonly TopicSignal _signal; // Separated service
    private readonly OffsetManager _offsetManager;
    private readonly ILogger<MeiliSyncWorker> _logger;

    private readonly MeilisearchClient _meiliClient;
    private readonly string _topicName;
    private readonly string _groupId;

    public MeiliSyncWorker(
        ITopicManager topicManager, 
        TopicSignal signal,
        OffsetManager offsetManager, 
        ILogger<MeiliSyncWorker> logger,
        MeilisearchClient client,
        string topicName = "listings", 
        string groupId = "meilisearch-sync")
    {
        _topicManager = topicManager;
        _signal = signal;
        _offsetManager = offsetManager;
        _logger = logger;
        _meiliClient = client;
        _topicName = topicName;
        _groupId = groupId;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Starting {WorkerName} for topic: {Topic}", nameof(MeiliSyncWorker), _topicName);

        long lastOffset = _offsetManager.GetOffset(_groupId, _topicName, 0);

        while (!stoppingToken.IsCancellationRequested)
        {
            try 
            {
                var partition = _topicManager.GetTopic(_topicName, 0);
                if (partition == null)
                {
                    await Task.Delay(5000, stoppingToken);
                    continue;
                }

                // Try to read the NEXT message
                var data = await partition.ReadAsync(lastOffset + 1);

                await ProcessMeiliIndex(data,stoppingToken);

                lastOffset++;
                await _offsetManager.CommitOffset(_groupId, _topicName, 0, lastOffset);
            }
            catch (IndexOutOfRangeException) 
            {
                // WAKE UP ONLY ON SIGNAL
                _logger.LogDebug("Caught up. Sleeping until signaled on {Topic}...", _topicName);
                
                // Directly await the separate signal service
                await _signal.WaitAsync(_topicName, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Meilisearch sync failed at offset {Offset}", lastOffset);
                await Task.Delay(5000, stoppingToken); 
            }
        }
    }

    private async Task ProcessMeiliIndex(byte[] data, CancellationToken ct)
    {
        // Adding options to handle Case Insensitivity just in case
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var taskData = JsonSerializer.Deserialize<ListingTaskData>(data, options);

        if (taskData != null)
        {
            switch (taskData.Action)
            {
                case ListingAction.Create:
                case ListingAction.Update:
                    // Meilisearch 'AddDocuments' acts as an Upsert
                    await HandleMeiliCreate(taskData, ct);
                    break;
                    
                case ListingAction.Delete:
                    await HandleMeiliDelete(taskData, ct);
                    break;
            }
        }
    }

private async Task HandleMeiliCreate(ListingTaskData taskData, CancellationToken ct)
{
    if (taskData.SearchData == null)
    {
        _logger.LogWarning("ListingTaskData {TaskId} has no SearchData. Skipping.", taskData.TaskId);
        return;
    }

    _logger.LogInformation("Processing Meilisearch sync (CREATE/UPDATE) for Listing {ListingId}", taskData.ListingId);

    var index = _meiliClient.Index("listings");

    // Meilisearch AddDocuments handles both creation and updates (upsert)
    // We wrap it in an array because the API expects a collection
    await index.AddDocumentsAsync(new[] { taskData.SearchData }, cancellationToken: ct);
}

private async Task HandleMeiliDelete(ListingTaskData taskData, CancellationToken ct)
{
    _logger.LogInformation("Processing Meilisearch DELETE for Listing {ListingId}", taskData.ListingId);

    var index = _meiliClient.Index("listings");

    // We use the ListingId as the document identifier to remove it from the index
    await index.DeleteDocumentsAsync(new[] { taskData.ListingId.ToString() }, cancellationToken: ct);
}
}