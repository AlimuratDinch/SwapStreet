using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Infrastructure.LogQueue;

public interface IPartition : IDisposable
{
    // Identification
    int Id { get; }
    long CurrentOffset { get; }

    // Events
    event Action<string>? OnDataAppended;

    // Writing Operations
    Task<long> AppendAsync(byte[] data);
    Task<long> AppendBatchAsync(List<byte[]> data);

    // Reading Operations
    Task<byte[]> ReadAsync(long offset);
    Task<(List<byte[]> Messages, long NextOffset)> ReadBatchAsync(long offset, int maxCount);

    // Maintenance
    Task TruncateFromIndexAsync(long index);
}