using System;
using System.IO;
using System.Text;

namespace backend.Infrastructure.LogQueue;

public class TopicData
{

    public required string TopicName { get; set; }

    public bool AutoFlush { get; set; }
    public int MaxFileSize { get; set; }

    public TimeSpan TimeSpan { get; set; }

    public List<PartitionMetadata> PartitionMetadata { get; set; } = new List<PartitionMetadata>();

}

public class PartitionMetadata
{
    public int PartitionId { get; set; }

}