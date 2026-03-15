using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace backend.Infrastructure.LogQueue;

public class Partition : IDisposable, IPartition
{
    public int Id { get; }
    private readonly string _directoryPath;
    private readonly ILoggerFactory _loggerFactory;
    private FileStream _fileStream;
    private FileStream _indexStream;
    private readonly int _maxFileSize; // In Bytes

    private readonly System.TimeSpan _retentionMaxAge = TimeSpan.FromMinutes(5);
    private readonly bool _autoFlush = false; //debug mode

    public long FileLength => _fileStream.Length;
    public long IndexLength => _indexStream.Length;

    private SortedDictionary<long, string> _offsets;

    private long _activeBaseOffset;

    private readonly ILogger<Partition> _logger;

    public long CurrentOffset => _activeBaseOffset + (IndexLength / 8);

    public event Action<string>? OnDataAppended;
    private readonly string _topicName;


    public Partition(int id, string topicName, string directoryPath, bool autoFlush, ILogger<Partition> logger, TimeSpan timeSpan, int maxFileSize = 1024)
    {
        Id = id;

        _logger = logger;

        _retentionMaxAge = timeSpan;

        _autoFlush = autoFlush;

        _directoryPath = directoryPath;

        _offsets = new SortedDictionary<long, string>();

        _maxFileSize = maxFileSize;

        _topicName = topicName;

        // Ensure folder exists
        if (!Directory.Exists(_directoryPath))
        {
            Directory.CreateDirectory(_directoryPath);
        }

        // STEP 1: Find the latest log file
        string latestFileName = "00000"; // Default if empty


        string[] files = Directory.GetFiles(_directoryPath, "*.log");
        if (files.Length > 0)
        {
            long max = long.MinValue;

            foreach (var file in files)
            {
                string currentPath = Path.GetFileNameWithoutExtension(file);
                long currentLong = long.Parse(currentPath);
                _offsets.Add(currentLong, currentPath);
                max = Math.Max(max, currentLong);
            }

            latestFileName = max.ToString("D5");
        }

        // The Safety Net: If nothing was found, create the default
        if (_offsets.Count == 0)
        {
            _offsets.Add(0, "00000");
        }

        // STEP 2: Open that file (Reusing old logic)
        OpenSegment(latestFileName);

        // Verify integrity ( check index matches with log )
        RecoverIndex();
    }

    // Stream opening logic
    private void OpenSegment(string nameWithoutExtension)
    {
        _activeBaseOffset = long.Parse(nameWithoutExtension);

        _logger.LogInformation("Switching active segment to: {SegmentName}", nameWithoutExtension);

        if (!_offsets.ContainsKey(_activeBaseOffset))
        {
            _offsets.Add(_activeBaseOffset, nameWithoutExtension);
        }

        string fullLogPath = Path.Combine(_directoryPath, nameWithoutExtension + ".log");
        string fullIndexPath = Path.Combine(_directoryPath, nameWithoutExtension + ".index");


        _fileStream = new FileStream(fullLogPath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.Read);
        _fileStream.Position = _fileStream.Length;

        _indexStream = new FileStream(fullIndexPath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.Read);
        _indexStream.Position = _indexStream.Length;

    }

    public async Task<long> AppendAsync(byte[] data)
    {
        // 1. CAPTURE STATE (Crucial for Return Value)
        // We calculate the ID this message will have (e.g., 0)
        long currentLogicalId = _activeBaseOffset + (_indexStream.Length / 8);
        long startingPosition = _fileStream.Position;

        // 2. Write to the Data Log
        byte[] lengthBytes = BitConverter.GetBytes(data.Length);
        await _fileStream.WriteAsync(lengthBytes);
        await _fileStream.WriteAsync(data);

        // 3. Write to the Index
        await _indexStream.WriteAsync(BitConverter.GetBytes(startingPosition));

        if (_autoFlush)
        {
            await _fileStream.FlushAsync();
            await _indexStream.FlushAsync();
        }

        // 4. Check for Roll Over
        if (_fileStream.Position >= _maxFileSize)
        {
            // The NEXT message will be at ID = current + 1
            long nextId = currentLogicalId + 1;

            string newFileName = nextId.ToString("D5");

            // Close the old file
            Dispose();

            // Open the new one
            OpenSegment(newFileName);

            //Run Prune to remove old files
            PruneOldSegments(_retentionMaxAge);
        }

        // Ring Bell
        OnDataAppended?.Invoke(_topicName);

        // 5. Return the ID of the message we just wrote
        return currentLogicalId;
    }

    public async Task<long> AppendBatchAsync(List<byte[]> data)
    {

        long lastLogicalId = _activeBaseOffset;
        List<List<byte>> fileBuffer = new List<List<byte>> { new List<byte>() };
        List<List<byte>> indexBuffer = new List<List<byte>> { new List<byte>() };

        List<long> nextIdList = new List<long> { 0 };

        int currentList = 0;

        long fileStreamPosition = _fileStream.Position;
        long indexStreamLength = _indexStream.Length;

        foreach (var value in data)
        {

            long currentLogicalId = _activeBaseOffset + (indexStreamLength / 8);
            long startingPosition = fileStreamPosition;
            lastLogicalId = currentLogicalId;

            // 2. Add to the file buffer
            byte[] lengthBytes = BitConverter.GetBytes(value.Length);
            fileBuffer[currentList].AddRange(lengthBytes);
            fileBuffer[currentList].AddRange(value);

            fileStreamPosition += lengthBytes.Length + value.Length;

            // 3. Add to the index buffer
            indexBuffer[currentList].AddRange(BitConverter.GetBytes(startingPosition));

            indexStreamLength += 8;

            // 4. Check for Roll Over
            if (fileStreamPosition >= _maxFileSize)
            {
                // The NEXT message will be at ID = current + 1
                long nextId = currentLogicalId + 1;

                nextIdList.Add(nextId);

                fileBuffer.Add(new List<byte>());
                indexBuffer.Add(new List<byte>());

                currentList++;
            }
        }
        // Handle creation of new files
        for (int i = 0; i < fileBuffer.Count(); i++)
        {
            if (i > 0)
            {

                string newFileName = nextIdList[i].ToString("D5");

                // Close the old file
                Dispose();

                // Open the new one
                OpenSegment(newFileName);

                await _fileStream.WriteAsync(fileBuffer[i].ToArray());
                await _indexStream.WriteAsync(indexBuffer[i].ToArray());

                //Run Prune to remove old files
                PruneOldSegments(_retentionMaxAge);

            }
            else
            {
                await _fileStream.WriteAsync(fileBuffer[i].ToArray());
                await _indexStream.WriteAsync(indexBuffer[i].ToArray());
            }

        }

        if (_autoFlush)
        {
            await _fileStream.FlushAsync();
            await _indexStream.FlushAsync();
        }

        // Ring Bell
        OnDataAppended?.Invoke(_topicName);

        // 5. Return the ID of the last message we wrote
        return lastLogicalId;
    }


    public async Task<byte[]> ReadAsync(long offset)
    {

        var validKeys = _offsets.Keys.Where(k => k <= offset);

        if (!validKeys.Any())
        {
            _logger.LogWarning("Client requested offset {Offset}, but it was already deleted by retention.", offset);
            throw new IndexOutOfRangeException();
        }

        long baseOffset = validKeys.Last();

        string fileName = _offsets[baseOffset];

        // 2. Construct the paths
        string indexName = Path.Combine(_directoryPath, fileName + ".index");
        string logName = Path.Combine(_directoryPath, fileName + ".log");

        // 3. Calculate Relative Position
        // If we want Offset 75, and the file starts at 74:
        // (75 - 74) * 8 = Position 8
        long relativeOffset = offset - baseOffset;
        long indexPosition = relativeOffset * 8;

        // 4. Open a TEMPORARY stream just for this read
        // We use "using" so it closes automatically
        using (FileStream tempIndex = File.OpenRead(indexName))
        {
            // Safety Check
            if (indexPosition >= tempIndex.Length)
                throw new IndexOutOfRangeException("Message not found");

            tempIndex.Position = indexPosition;

            byte[] indexBuffer = new byte[8];
            await tempIndex.ReadExactlyAsync(indexBuffer, 0, 8);
            long logPosition = BitConverter.ToInt64(indexBuffer, 0);

            // 5. Open the Log File to get the data
            using (FileStream tempLog = File.OpenRead(logName))
            {
                tempLog.Position = logPosition;

                // Read Length
                byte[] lengthBuffer = new byte[4];
                await tempLog.ReadExactlyAsync(lengthBuffer);
                int messageLength = BitConverter.ToInt32(lengthBuffer, 0);

                // Read Payload
                byte[] payload = new byte[messageLength];
                await tempLog.ReadExactlyAsync(payload);

                return payload;
            }
        }
    }



    public async Task<(List<byte[]> Messages, long NextOffset)> ReadBatchAsync(long offset, int maxCount)
    {
        // Finds .log file closest to index ( smaller than )
        var validKeys = _offsets.Keys.Where(k => k <= offset);

        if (!validKeys.Any())
        {
            _logger.LogWarning("Client requested offset {Offset}, but it was already deleted by retention.", offset);
            throw new IndexOutOfRangeException();
        }

        // Set baseOffset to closest in value index
        long baseOffset = validKeys.Last();

        // Get file name from base offset
        string fileName = _offsets[baseOffset];

        // 2. Construct the paths
        string indexName = Path.Combine(_directoryPath, fileName + ".index");
        string logName = Path.Combine(_directoryPath, fileName + ".log");

        // 3. Calculate Relative Position
        // If we want Offset 75, and the file starts at 74:
        // (75 - 74) * 8 = Position 8
        long relativeOffset = offset - baseOffset;
        long indexPosition = relativeOffset * 8;

        List<byte[]> readResults = new List<byte[]>();

        // 4. Open TEMPORARY streams

        while (readResults.Count < maxCount)
        {

            int i = 0;

            // 1. Open the CURRENT file (whatever 'indexName' is set to right now)
            using (FileStream tempIndex = File.OpenRead(indexName))
            using (FileStream tempLog = File.OpenRead(logName))
            {
                {
                    while (readResults.Count < maxCount)
                    {

                        long currentIndexPosition = indexPosition + (i * 8);

                        // Safety Check
                        if (currentIndexPosition >= tempIndex.Length)
                        {

                            long currentMessageId = offset + readResults.Count();

                            validKeys = _offsets.Keys.Where(k => k <= currentMessageId);
                            if (!validKeys.Any())
                            {
                                //No more index to read, return what we have
                                return (readResults, offset + readResults.Count);
                            }

                            baseOffset = validKeys.Last();

                            // Get file name from new base offset
                            fileName = _offsets[baseOffset];

                            // 2. Construct the new paths
                            indexName = Path.Combine(_directoryPath, fileName + ".index");
                            logName = Path.Combine(_directoryPath, fileName + ".log");

                            relativeOffset = currentMessageId - baseOffset;
                            indexPosition = relativeOffset * 8;

                            // Filenames changed, we need to re declare them
                            break;

                        }

                        // Safety Check
                        if (currentIndexPosition >= tempIndex.Length)
                            throw new IndexOutOfRangeException("Message not found");

                        tempIndex.Position = currentIndexPosition;

                        byte[] indexBuffer = new byte[8];
                        await tempIndex.ReadExactlyAsync(indexBuffer, 0, 8);
                        long logPosition = BitConverter.ToInt64(indexBuffer, 0);

                        tempLog.Position = logPosition;


                        // Read Length
                        byte[] lengthBuffer = new byte[4];

                        try
                        {

                            await tempLog.ReadExactlyAsync(lengthBuffer);

                        }
                        catch (EndOfStreamException)
                        {
                            _logger.LogWarning("[BatchReadAsync] EndOfStreamException - Returning partial result.");

                            // Stop everything and return what we have
                            return (readResults, offset + readResults.Count);
                        }

                        int messageLength = BitConverter.ToInt32(lengthBuffer, 0);

                        // Read Payload
                        byte[] payload = new byte[messageLength];
                        await tempLog.ReadExactlyAsync(payload);
                        readResults.Add(payload);
                        i++;

                    }
                }

            }
        }
        return (readResults, offset + readResults.Count);
    }

    // Remove old logs
    private void PruneOldSegments(TimeSpan maxAge)
    {
        DateTime cutoff = DateTime.Now - maxAge;

        // Create a copy of the keys so we can remove items safely
        var segmentOffsets = _offsets.Keys.ToList();

        foreach (var baseOffset in segmentOffsets)
        {
            // RULE 1: Never delete the active file
            if (baseOffset == _activeBaseOffset) continue;

            string fileName = _offsets[baseOffset];
            string fullLogPath = Path.Combine(_directoryPath, fileName + ".log");
            string fullIndexPath = Path.Combine(_directoryPath, fileName + ".index");

            // RULE 2: Check the age
            FileInfo info = new FileInfo(fullLogPath);
            if (info.LastWriteTime < cutoff)
            {
                _logger.LogInformation("[Retention] Deleting expired segment: {SegmentName}", fileName);

                // Delete files
                if (File.Exists(fullLogPath)) File.Delete(fullLogPath);
                if (File.Exists(fullIndexPath)) File.Delete(fullIndexPath);

                // Remove from Registry
                _offsets.Remove(baseOffset);
            }
        }
    }

    private void RecoverIndex()
    {
        _logger.LogWarning("Starting Index Recovery on segment {BaseOffset}", _activeBaseOffset);

        if (_indexStream.Length == 0)
            return;

        // 1. Get the last index entry
        _indexStream.Seek(-8, SeekOrigin.End);
        byte[] buffer = new byte[8];
        _indexStream.ReadExactly(buffer); // Safer than Read
        long lastMessageStart = BitConverter.ToInt64(buffer, 0);

        // 2. We need to find where that last message ENDS to know if the log is healthy
        _fileStream.Seek(lastMessageStart, SeekOrigin.Begin);
        byte[] lenBuffer = new byte[4];
        if (_fileStream.Read(lenBuffer, 0, 4) == 4)
        {
            int lastMessageLen = BitConverter.ToInt32(lenBuffer, 0);
            long expectedLogLength = lastMessageStart + 4 + lastMessageLen;

            // 3. Only truncate if the log is actually corrupted/longer than the index
            if (_fileStream.Length > expectedLogLength)
            {
                _logger.LogWarning("[Recovery] Truncating corrupted log tail from {Old} to {New}", _fileStream.Length, expectedLogLength);
                _fileStream.SetLength(expectedLogLength);
            }
        }

        // 4. Always ensure the writer is at the very end
        _fileStream.Position = _fileStream.Length;
        _indexStream.Position = _indexStream.Length;
    }

    public async Task TruncateFromIndexAsync(long index)
    {
        if (index < 0)
            throw new ArgumentOutOfRangeException(nameof(index));


        long indexFileLength = _indexStream.Length;
        long totalEntries = indexFileLength / 8;

        // Nothing to truncate
        if (index >= totalEntries)
            return;

        // 1. Read the log byte offset from the index file
        long indexEntryOffset = index * 8;

        byte[] buffer = new byte[8];

        _indexStream.Seek(indexEntryOffset, SeekOrigin.Begin);
        int read = await _indexStream.ReadAsync(buffer, 0, buffer.Length);

        if (read != 8)
            throw new IOException("Failed to read index entry");

        long logByteOffset = BitConverter.ToInt64(buffer, 0);

        // 2. Truncate the log file
        if (logByteOffset < 0 || logByteOffset > _fileStream.Length)
            throw new InvalidDataException("Corrupted index entry");

        _fileStream.SetLength(logByteOffset);
        await _fileStream.FlushAsync();

        // 3. Truncate the index file
        _indexStream.SetLength(indexEntryOffset);
        await _indexStream.FlushAsync();
    }



    public void Dispose()
    {
        _fileStream.Close();
        _indexStream.Close();
    }


}
