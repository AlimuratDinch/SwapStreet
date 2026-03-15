using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace backend.Infrastructure.LogQueue;

public class OffsetManager
{
    // 1. Define fields for your In-Memory Cache (Dictionary) and the storage file path
    private readonly Dictionary<string, long> _offsets;
    private readonly string _storagePath;

    public OffsetManager(string basePath)
    {

        _offsets = new Dictionary<string, long>();

        _storagePath = Path.Combine(basePath, "consumer_offsets.dat");

        if (File.Exists(_storagePath))
        {
            LoadFromDisk();
        }

    }

    /// <summary>
    /// Saves the "Bookmark". The client tells us "I have finished processing up to Offset X".
    /// </summary>
    public async Task CommitOffset(string group, string topic, int partitionId, long offset)
    {
        group = Uri.EscapeDataString(group);
        topic = Uri.EscapeDataString(topic);

        string key = $"{group}|{topic}|{partitionId}";
        _offsets[key] = offset;
        await SaveToDiskAsync();
    }

    /// <summary>
    /// Retrieves the "Bookmark". If this group has never seen this topic, return 0.
    /// </summary>
    public long GetOffset(string group, string topic, int partitionId)
    {
        group = Uri.EscapeDataString(group);
        topic = Uri.EscapeDataString(topic);

        string key = $"{group}|{topic}|{partitionId}";

        if (_offsets.TryGetValue(key, out long value))
        {
            return value;
        }

        return 0;
    }

    // Helper method to write the dictionary to the file
    private async Task SaveToDiskAsync()
    {
        List<string> lines = new List<string>();

        foreach (var kvp in _offsets)
        {
            var parts = kvp.Key.Split('|');
            lines.Add($"{parts[0]},{parts[1]},{parts[2]},{kvp.Value}");

        }

        await File.WriteAllLinesAsync(_storagePath, lines);
    }


    private void LoadFromDisk()
    {
        foreach (var line in File.ReadAllLines(_storagePath))
        {
            // Format: "group,topic,partitionId,offset"
            var parts = line.Split(',');
            if (parts.Length == 4 && long.TryParse(parts[3], out long offset) && int.TryParse(parts[2], out int partId))
            {
                string key = $"{parts[0]}|{parts[1]}|{partId}"; // Composite Key
                _offsets[key] = offset;
            }
        }
    }
}