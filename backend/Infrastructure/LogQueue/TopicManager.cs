
using System;
using System.IO;
using System.Text;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using System.Collections.Concurrent;
using System.Threading.Channels;

namespace backend.Infrastructure.LogQueue;

public class TopicManager : ITopicManager, IDisposable
{

    private readonly string _basePath;

    // Topic name (unique), Partition obj
    private Dictionary<string, List<IPartition>> _topics;

    private readonly ILoggerFactory _loggerFactory;

    private Dictionary<string,TopicState> _topicStates;

    private int _defaultPartitions = 1;

    private readonly TopicSignal _signal;

    private TopicManager(string basePath,TopicSignal signal, ILoggerFactory loggerFactory, int defaultPartitions)
    {
        _basePath = basePath;
        _signal = signal;
        _loggerFactory = loggerFactory;
        _topics = new Dictionary<string, List<IPartition>>();
        _topicStates = new Dictionary<string, TopicState>();
        _defaultPartitions = defaultPartitions;

    }


    public static async Task<TopicManager> InitializeAsync(string basePath,TopicSignal signal, ILoggerFactory loggerFactory, int defaultPartitions = 1)
    {

        TopicManager topicManager = new TopicManager(basePath,signal,loggerFactory,defaultPartitions);

        await topicManager.LoadTopics();

        return topicManager;
        
    }

    public async Task CreateTopic(string topic, int partitionCount,bool autoFlush,int maxFileSize, TimeSpan timeSpan)
    {
        // 1. Safety Check: Don't overwrite existing topics
        if (_topics.ContainsKey(topic) || Directory.Exists(Path.Combine(_basePath, topic)))
        {
            Console.WriteLine($"Topic '{topic}' already exists. Skipping creation.");
            return;
        }

        // 2. Prepare for creation
        if (!Directory.Exists(_basePath)) Directory.CreateDirectory(_basePath);

        ILogger<Partition> partitionLogger = _loggerFactory.CreateLogger<Partition>();
        List<IPartition> newPartitions = new List<IPartition>();

        TopicData tpd = new TopicData
            {
                TopicName = topic,
                AutoFlush = autoFlush,
                MaxFileSize = maxFileSize,
                TimeSpan = timeSpan
            };

        // 3. Create the specific number of partitions requested, save the state
        for (int i = 0; i < partitionCount; i++)
        {
            string newFolder = Path.Combine(_basePath, topic, $"{topic}-{i}");

            Partition newPartition = new Partition(i,topic,newFolder,autoFlush, partitionLogger, timeSpan, maxFileSize);
            newPartitions.Add(newPartition);

            // Add pulse to notify workers when new logs are appended
            newPartition.OnDataAppended += (topic) => _signal.Pulse(topic);

            PartitionMetadata ptmtd = new PartitionMetadata()
            {
                PartitionId = i,
            };

            tpd.PartitionMetadata.Add(ptmtd);

        }

        string newPath = Path.Combine(_basePath,topic);

        TopicState ts = await TopicState.CreateAsync(newPath,tpd);

        // 4. Register it in memory
        _topicStates[topic] = ts;
        _topics[topic] = newPartitions;
        // Add Channel
        _signal.AddTopic(topic);

        Console.WriteLine($"Created topic '{topic}' with {partitionCount} partitions.");
    }

    public IPartition GetTopic(string topic, int index = -1)
    {
        // Ensure valid param
        if (string.IsNullOrEmpty(topic)) return null;

        // If topic exists return logSegment right away based on provided index if any
        if (_topics.TryGetValue(topic, out var partitions))
        {

            if (index <= partitions.Count - 1)
            
                return partitions[index];
        }

        return null;
    }



private async Task LoadTopics()
{
    if (!Directory.Exists(_basePath)) Directory.CreateDirectory(_basePath);

    // Initialize the dictionary once at the start
    _topics ??= new Dictionary<string, List<IPartition>>();

    string[] drs = Directory.GetDirectories(_basePath);
    
    foreach (var dr in drs)
    {
        string topic = Path.GetFileName(dr);
        string topicPath = Path.Combine(_basePath, topic);
        string statePath = Path.Combine(topicPath, "state.json");

        // FIX 1: Don't RETURN. Just skip this specific directory if it's not a valid topic.
        if (!File.Exists(statePath))
        {
            continue; 
        }

        try 
        {
            TopicState ts = await TopicState.LoadAsync(topicPath);
            if (ts is null) continue;

            List<IPartition> newPartitions = new List<IPartition>();
            _topicStates[topic] = ts;

            foreach (var pmtda in ts.TopicData.PartitionMetadata)
            {
                ILogger<Partition> partitionLogger = _loggerFactory.CreateLogger<Partition>();

                int partitionId = pmtda.PartitionId;
                bool autoFlush = ts.TopicData.AutoFlush;
                TimeSpan timeSpan = ts.TopicData.TimeSpan;
                int maxFileSize = ts.TopicData.MaxFileSize;

                string partitionPath = Path.Combine(topicPath, $"{topic}-{partitionId}");

                Partition newPartition = new Partition(partitionId, topic, partitionPath, autoFlush, partitionLogger, timeSpan, maxFileSize);
                newPartitions.Add(newPartition);

                // Wire up the signal pulse
                newPartition.OnDataAppended += (t) => _signal.Pulse(t);
            }

            _topics[topic] = newPartitions;
            _signal.AddTopic(topic); // Register with signal manager
        }
        catch (Exception ex)
        {
        }
    }
}


        // The Worker calls this once in its constructor or ExecuteAsync
    public ChannelReader<bool> GetSignalReader(string topicName)
    {
        // This asks the TopicSignal to find or create the pipe 
        // and return the "Listen-Only" side (the Reader).
        return _signal.GetReader(topicName);
    }

        public void Dispose()
    {
        _loggerFactory.CreateLogger<TopicManager>().LogInformation("TopicManager shutting down. Closing all partitions...");

        foreach (var partitionList in _topics.Values)
        {
            foreach (var partition in partitionList)
            {
                // The Manager doesn't read/write, but it DOES clean up
                partition.Dispose();
            }
        }
    }

    }



