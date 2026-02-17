# Delete Operations Flow and MinIO Storage Management

## Overview

This document describes the delete operations in SwapStreet, focusing on the two distinct delete strategies:
1. **Storage-First Delete** (ListingCommandService): Used for complete listing deletion - deletes from storage first, then database
2. **Database-First Delete** (MinioFileStorageService): Used for general image deletion - deletes from database first, then storage

Both strategies handle failures gracefully and include automatic orphaned file cleanup mechanisms.

---

## Table of Contents

- [Delete Operations Flow and MinIO Storage Management](#delete-operations-flow-and-minio-storage-management)
  - [Overview](#overview)
  - [Table of Contents](#table-of-contents)
  - [Architecture Principles](#architecture-principles)
  - [1. Storage-First Delete: Listing Deletion](#1-storage-first-delete-listing-deletion)
    - [Flow Diagram](#flow-diagram)
    - [Implementation Details](#implementation-details)
    - [Rollback Behavior](#rollback-behavior)
    - [Error Scenarios](#error-scenarios)
  - [2. Database-First Delete: Image Deletion](#2-database-first-delete-image-deletion)
    - [Flow Diagram](#flow-diagram-1)
    - [Implementation Details](#implementation-details-1)
    - [Orphaned File Handling](#orphaned-file-handling)
    - [Error Scenarios](#error-scenarios-1)
  - [3. Storage-Only Delete](#3-storage-only-delete)
    - [Implementation Details](#implementation-details-2)
  - [4. Orphaned File Cleanup System](#4-orphaned-file-cleanup-system)
    - [Cleanup Architecture](#cleanup-architecture)
    - [Fire-and-Forget Execution](#fire-and-forget-execution)
    - [Thread-Safe Scheduling](#thread-safe-scheduling)
    - [Cleanup Process](#cleanup-process)
  - [5. Transaction Management](#5-transaction-management)
    - [Database Transactions](#database-transactions)
    - [Cross-System Coordination](#cross-system-coordination)
  - [6. Error Handling and Logging](#6-error-handling-and-logging)
    - [Logging Strategy](#logging-strategy)
    - [Exception Types](#exception-types)
  - [7. Design Decisions and Trade-offs](#7-design-decisions-and-trade-offs)
    - [Why Two Different Delete Strategies?](#why-two-different-delete-strategies)
    - [Why Accept Orphaned Files?](#why-accept-orphaned-files)
    - [Why Fire-and-Forget Cleanup?](#why-fire-and-forget-cleanup)
  - [8. Performance Considerations](#8-performance-considerations)
  - [9. Testing Strategy](#9-testing-strategy)
    - [Unit Tests](#unit-tests)
    - [Integration Tests](#integration-tests)
  - [10. Future Improvements](#10-future-improvements)
  - [Summary](#summary)

---

## Architecture Principles

1. **Separation of Concerns**: MinIO (storage) and PostgreSQL (database) are independent systems with separate transactions
2. **Graceful Degradation**: Operations continue even when MinIO is temporarily unavailable
3. **No Schema Changes**: Orphaned file tracking uses in-memory state rather than requiring database schema changes
4. **Fast Response Times**: Cleanup operations run in the background to avoid blocking user requests
5. **Consistency Priority**: Database consistency is prioritized over storage consistency

---

## 1. Storage-First Delete: Listing Deletion

**Used by**: `ListingCommandService.DeleteListingAsync()`

**Purpose**: Ensures complete removal of listings with no orphaned listings (listings without images are acceptable, listings pointing to missing images are not)

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ DeleteListingAsync(listingId, profileId)                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Validate Listing Exists & Belongs to User           │
│  - Query: Listings WHERE Id = listingId AND                 │
│           ProfileId = profileId                             │
│  - If not found: throw ArgumentException                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Fetch Image Paths (AsNoTracking)                    │
│  - Query: ListingImages WHERE ListingId = listingId         │
│  - Extract: imagePaths = images.Select(i => i.ImagePath)    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Delete Images from MinIO (Storage-First)            │
│  - Call: DeleteFilesAsync(UploadType.Listing, imagePaths)   │
│  - Returns: List of failed deletes                          │
│  - If ANY failures: throw InvalidOperationException         │
│  - CRITICAL: Database NOT modified yet                      │
└─────────────────────────────────────────────────────────────┘
                          │
                 ┌────────┴────────┐
                 │   SUCCESS?      │
                 └────────┬────────┘
                          │ Yes
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Delete from Database (Transactional)                │
│  - BEGIN TRANSACTION                                         │
│  - Remove: ListingImages records                            │
│  - Remove: Listing record                                   │
│  - COMMIT TRANSACTION                                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │   Complete    │
                  └───────────────┘
```

### Implementation Details

**File**: `backend/Services/Listings/ListingCommandService.cs`

```csharp
public async Task DeleteListingAsync(Guid listingId, Guid profileId, 
    CancellationToken cancellationToken = default)
{
    // 1. Validate listing exists and belongs to profile
    var listing = await _context.Listings
        .AsNoTracking()
        .FirstOrDefaultAsync(l => l.Id == listingId && l.ProfileId == profileId, 
            cancellationToken);
    
    if (listing == null)
        throw new ArgumentException($"Listing {listingId} not found");

    // 2. Fetch image paths up front so storage cleanup can happen before DB changes
    var listingImages = await _context.ListingImages
        .AsNoTracking()
        .Where(li => li.ListingId == listingId)
        .ToListAsync(cancellationToken);

    var imagePaths = listingImages
        .Select(li => li.ImagePath)
        .Where(path => !string.IsNullOrWhiteSpace(path))
        .ToList();

    // 3. Delete images from MinIO first to avoid DB deletes if storage fails
    if (imagePaths.Count != 0)
    {
        if (_fileStorageService == null)
            throw new InvalidOperationException(
                "File storage service not available for listing deletion.");

        var failedDeletes = await _fileStorageService
            .DeleteFilesAsync(UploadType.Listing, imagePaths, cancellationToken);
        
        if (failedDeletes.Count != 0)
            throw new InvalidOperationException(
                $"Failed to delete {failedDeletes.Count} image(s) for listing {listingId}");
    }

    // 4. Delete listing and image rows in a single DB transaction
    using var transaction = await _context.Database
        .BeginTransactionAsync(cancellationToken);
    try
    {
        if (listingImages.Count != 0)
            _context.ListingImages.RemoveRange(listingImages);

        _context.Listings.Remove(listing);
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }
    catch (Exception ex)
    {
        await transaction.RollbackAsync(cancellationToken);
        throw;
    }
}
```

### Rollback Behavior

**Automatic Rollback Points**:

1. **Before Storage Delete**: If validation fails, nothing is modified
2. **After Storage Delete Fails**: Database remains unchanged, no rollback needed (natural rollback)
3. **During Database Transaction**: Explicit database rollback via `transaction.RollbackAsync()`

**Important**: Storage deletes CANNOT be rolled back. Once files are deleted from MinIO, they're gone. This is why storage deletion happens first - we'd rather have orphaned files in storage than orphaned listings in the database.

### Error Scenarios

| Scenario | Database State | Storage State | User Impact | Recovery |
|----------|---------------|---------------|-------------|----------|
| Listing not found | Unchanged | Unchanged | Error message | None needed |
| Storage service unavailable | Unchanged | Unchanged | Error message | Retry when service available |
| Some images fail to delete | Unchanged | Partially deleted | Error message | Manual cleanup or retry |
| All images fail to delete | Unchanged | Unchanged | Error message | Investigate MinIO |
| DB transaction fails | Rolled back | Files deleted | Error message | Orphaned files in storage |

**Handling the Last Scenario**: If database transaction fails after storage deletion, orphaned files remain in MinIO. These will be cleaned up by the automatic orphaned file cleanup system (see Section 4).

---

## 2. Database-First Delete: Image Deletion

**Used by**: `MinioFileStorageService.DeleteImagesAsync()`

**Purpose**: Delete all images for a specific entity (listing, profile, etc.) with graceful handling of storage failures

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ DeleteImagesAsync(type, listingId?, profileId?)             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Validate Required IDs & Retrieve Image Paths        │
│  - Validate type-specific IDs (listingId or profileId)      │
│  - Query appropriate table (ListingImages, TryOnImages, etc)│
│  - Extract image paths from database                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Delete from Database FIRST (Database-First)         │
│  - BEGIN TRANSACTION                                         │
│  - Remove records from image table                          │
│  - COMMIT TRANSACTION                                        │
│  - Log success                                              │
│  - CRITICAL: Even if MinIO fails, DB is already clean       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Delete from MinIO AFTER (Best Effort)               │
│  - Loop through each image path                             │
│  - Try to delete from MinIO                                 │
│  - On failure: Log as ORPHANED, continue to next file       │
│  - Track all orphaned files                                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
                 ┌────────┴────────┐
                 │ Orphaned Files? │
                 └────────┬────────┘
                          │ Yes
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Schedule Automatic Cleanup                          │
│  - Mark type for cleanup: _cleanupPending[type] = 1         │
│  - Call: TrySchedulePendingCleanup()                        │
│  - Cleanup runs in background (fire-and-forget)             │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Details

**File**: `backend/Services/MinioFileStorageService.cs`

```csharp
public async Task DeleteImagesAsync(UploadType type, Guid? listingId = null, 
    Guid? profileId = null, CancellationToken cancellationToken = default)
{
    // 1. Validate and retrieve image paths
    List<string> imagePaths = [];
    
    switch (type)
    {
        case UploadType.Listing:
            imagePaths = await _context.ListingImages
                .Where(li => li.ListingId == listingId.Value)
                .Select(li => li.ImagePath)
                .ToListAsync(cancellationToken);
            break;
        // ... other types
    }

    if (imagePaths.Count == 0)
        return;

    // 2. Delete from database FIRST (in transaction)
    using var transaction = await _context.Database
        .BeginTransactionAsync(cancellationToken);
    try
    {
        // Remove database records
        var imagesToDelete = await _context.ListingImages
            .Where(li => li.ListingId == listingId.Value)
            .ToListAsync(cancellationToken);

        _context.ListingImages.RemoveRange(imagesToDelete);
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }
    catch (Exception ex)
    {
        await transaction.RollbackAsync(cancellationToken);
        throw;
    }

    // 3. Delete from MinIO AFTER database transaction commits
    var orphanedFiles = new List<string>();
    foreach (var imagePath in imagePaths)
    {
        try
        {
            await _minio.RemoveObjectAsync(new RemoveObjectArgs()
                .WithBucket(bucket)
                .WithObject(imagePath));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete image from MinIO: {ImagePath}. " +
                "File is ORPHANED - schedule cleanup.", imagePath);
            orphanedFiles.Add(imagePath);
            // Continue with next file - don't let one failure stop others
        }
    }

    // 4. Schedule cleanup if any files are orphaned
    if (orphanedFiles.Count != 0)
    {
        _cleanupPending[type] = 1;
        TrySchedulePendingCleanup();
    }
}
```

### Orphaned File Handling

**Key Principle**: Database consistency is more important than storage consistency.

**Orphaned Files**: Files that exist in MinIO but have no corresponding database records.

**Why Accept Orphaned Files?**
- Database is the source of truth
- Orphaned files don't break application functionality
- Orphaned listings (database records without files) would cause errors
- Automatic cleanup handles orphaned files asynchronously

**Tracking Mechanism**:
```csharp
// Static fields for cross-request state
private static readonly ConcurrentDictionary<UploadType, byte> _cleanupPending = new();
private static int _cleanupRunning = 0;
```

### Error Scenarios

| Scenario | Database State | Storage State | User Impact | Recovery |
|----------|---------------|---------------|-------------|----------|
| DB transaction fails | Rolled back | Unchanged | Error message | None needed |
| One MinIO delete fails | Cleaned | Partially cleaned | None (transparent) | Automatic cleanup |
| All MinIO deletes fail | Cleaned | Unchanged | None (transparent) | Automatic cleanup |
| MinIO unavailable | Cleaned | Unchanged | None (transparent) | Cleanup when available |

**Critical Insight**: This approach prioritizes user experience over storage efficiency. The user sees immediate success, and the system handles cleanup in the background.

---

## 3. Storage-Only Delete

**Used by**: `MinioFileStorageService.DeleteFilesAsync()`

**Purpose**: Delete files from storage without modifying the database (used by storage-first delete flow)

### Implementation Details

```csharp
public async Task<IReadOnlyCollection<string>> DeleteFilesAsync(
    UploadType type,
    IEnumerable<string> filePaths,
    CancellationToken cancellationToken = default)
{
    var bucket = type == UploadType.TryOn || type == UploadType.Generated
        ? _settings.PrivateBucketName
        : _settings.PublicBucketName;

    var failedDeletes = new List<string>();

    foreach (var filePath in filePaths)
    {
        try
        {
            await _minio.RemoveObjectAsync(new RemoveObjectArgs()
                .WithBucket(bucket)
                .WithObject(filePath));
        }
        catch (Exception ex)
        {
            failedDeletes.Add(filePath);
            _logger.LogError(ex, "Failed to delete object {ObjectKey} from bucket {Bucket}", 
                filePath, bucket);
        }
    }

    return failedDeletes;
}
```

**Key Characteristics**:
- No database operations
- Returns list of failures (empty list = complete success)
- Caller decides how to handle failures
- Used by `ListingCommandService` for storage-first delete

---

## 4. Orphaned File Cleanup System

### Cleanup Architecture

The cleanup system runs automatically in the background when orphaned files are detected. It uses a fire-and-forget pattern to avoid blocking request processing.

**State Management**:
```csharp
// Track which upload types need cleanup
private static readonly ConcurrentDictionary<UploadType, byte> _cleanupPending = new();

// Prevent multiple cleanup runners from executing simultaneously
private static int _cleanupRunning = 0;
```

### Fire-and-Forget Execution

```csharp
private void TrySchedulePendingCleanup()
{
    // If nothing to clean, exit early
    if (_cleanupPending.IsEmpty)
        return;

    // If cleanup already running, exit (prevents duplicate work)
    if (Interlocked.CompareExchange(ref _cleanupRunning, 1, 0) != 0)
        return;

    // Start background cleanup (non-blocking)
    _ = Task.Run(async () =>
    {
        try
        {
            foreach (var uploadType in _cleanupPending.Keys.ToList())
            {
                var bucket = uploadType == UploadType.TryOn || uploadType == UploadType.Generated
                    ? _settings.PrivateBucketName
                    : _settings.PublicBucketName;

                // Check if MinIO is available before attempting cleanup
                if (!await IsMinioAvailableAsync(bucket))
                    continue;

                try
                {
                    var deletedCount = await CleanupOrphanedFilesAsync(uploadType);
                    _logger.LogInformation("Auto-cleanup deleted {Count} orphaned files " +
                        "for type {Type}", deletedCount, uploadType);
                    
                    // Remove from pending list after successful cleanup
                    _cleanupPending.TryRemove(uploadType, out _);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Auto-cleanup failed for type {Type}", uploadType);
                    // Leave in pending list for next cleanup attempt
                }
            }
        }
        finally
        {
            // Allow future cleanups
            Interlocked.Exchange(ref _cleanupRunning, 0);
        }
    });
}
```

### Thread-Safe Scheduling

**Race Condition Prevention**:
1. `Interlocked.CompareExchange` ensures only one cleanup runner executes at a time
2. `ConcurrentDictionary` allows safe multi-threaded access to pending cleanup list
3. `_cleanupRunning` flag prevents duplicate work across multiple requests

**Example Scenario**:
```
Request 1: DeleteImagesAsync fails on 3 files
           → Marks Listing type for cleanup
           → Starts cleanup Task A

Request 2: DeleteImagesAsync fails on 2 files (concurrent)
           → Marks Listing type for cleanup
           → Tries to start cleanup, but Task A is running
           → Exits early (no duplicate work)

Task A:    Completes cleanup
           → Resets _cleanupRunning flag
           → Listing type removed from pending

Request 3: DeleteImagesAsync fails on 1 file (later)
           → Marks Listing type for cleanup
           → Starts cleanup Task B (A has finished)
```

### Cleanup Process

```csharp
public async Task<int> CleanupOrphanedFilesAsync(UploadType type, 
    CancellationToken cancellationToken = default)
{
    var prefix = $"{type.ToString().ToLower()}/";
    var bucket = type == UploadType.TryOn || type == UploadType.Generated
        ? _settings.PrivateBucketName
        : _settings.PublicBucketName;

    // 1. Get all valid file paths from database
    HashSet<string> validPaths;
    switch (type)
    {
        case UploadType.Listing:
            validPaths = (await _context.ListingImages
                .Select(li => li.ImagePath)
                .ToListAsync(cancellationToken))
                .ToHashSet(StringComparer.Ordinal);
            break;
        // ... other types
    }

    // 2. List all files in MinIO with the type prefix
    var args = new ListObjectsArgs()
        .WithBucket(bucket)
        .WithPrefix(prefix)
        .WithRecursive(true);

    var deletedCount = 0;
    var failedDeletes = new List<string>();

    // 3. Delete files that aren't in the database
    await foreach (var item in _minio.ListObjectsEnumAsync(args))
    {
        if (validPaths.Contains(item.Key))
            continue; // File is valid, skip

        try
        {
            await _minio.RemoveObjectAsync(new RemoveObjectArgs()
                .WithBucket(bucket)
                .WithObject(item.Key));
            deletedCount++;
        }
        catch (Exception ex)
        {
            failedDeletes.Add(item.Key);
            _logger.LogError(ex, "Failed to delete orphaned object {ObjectKey}", item.Key);
        }
    }

    return deletedCount;
}
```

**Cleanup Algorithm**:
1. Query database for all valid file paths of the given type
2. List all files in MinIO with matching prefix
3. For each MinIO file:
   - If path exists in database → Keep (valid file)
   - If path NOT in database → Delete (orphaned file)

---

## 5. Transaction Management

### Database Transactions

**PostgreSQL ACID Properties**:
- **Atomicity**: All changes within a transaction succeed or all fail
- **Consistency**: Database moves from one valid state to another
- **Isolation**: Concurrent transactions don't interfere with each other
- **Durability**: Committed changes persist even after crashes

**Transaction Usage**:
```csharp
using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
try
{
    // Multiple database operations
    _context.ListingImages.RemoveRange(images);
    _context.Listings.Remove(listing);
    
    await _context.SaveChangesAsync(cancellationToken);
    await transaction.CommitAsync(cancellationToken);
}
catch (Exception ex)
{
    await transaction.RollbackAsync(cancellationToken);
    throw;
}
```

### Cross-System Coordination

**The Challenge**: MinIO and PostgreSQL are separate systems that cannot participate in distributed transactions.

**Solution**: Carefully ordered operations with acceptance of temporary inconsistency.

**Two Patterns**:

1. **Storage-First** (for complete entity deletion):
   ```
   Delete Storage → Delete Database
   
   Success: Both cleaned
   Storage Fails: Nothing cleaned (safe)
   Database Fails: Orphaned files (acceptable, will cleanup)
   ```

2. **Database-First** (for partial deletion):
   ```
   Delete Database → Delete Storage
   
   Success: Both cleaned
   Database Fails: Nothing cleaned (safe)
   Storage Fails: Orphaned files (acceptable, will cleanup)
   ```

**Why No Two-Phase Commit?**
- MinIO doesn't support distributed transactions
- Added complexity with minimal benefit
- Orphaned file cleanup handles inconsistencies
- Database consistency is more critical than storage consistency

---

## 6. Error Handling and Logging

### Logging Strategy

**Log Levels**:
- **Information**: Normal operations (deletion start, success, counts)
- **Warning**: Partial failures (some files not deleted, cleanup pending)
- **Error**: Critical failures (all deletes failed, transaction rollback)

**Structured Logging Examples**:
```csharp
// Success
_logger.LogInformation("Deleted listing {ListingId} and {ImageCount} images from database", 
    listingId, images.Count);

// Warning
_logger.LogWarning("Total orphaned files in MinIO for {Type}: {Count}. Bucket: {Bucket}", 
    type, orphanedFiles.Count, bucket);

// Error
_logger.LogError(ex, "Failed to delete image from MinIO: {ImagePath}. " +
    "File is ORPHANED - schedule cleanup.", imagePath);
```

### Exception Types

| Exception | Meaning | User Action | System Action |
|-----------|---------|-------------|---------------|
| `ArgumentException` | Invalid request (listing not found, ID mismatch) | Check input and retry | None |
| `InvalidOperationException` | Operation failed (storage unavailable, deletes failed) | Retry later | Log and return error |
| `DbUpdateException` | Database constraint violation | Fix data issue | Rollback transaction |
| Generic `Exception` | Unexpected error | Contact support | Log full stack trace |

---

## 7. Design Decisions and Trade-offs

### Why Two Different Delete Strategies?

**Storage-First (Listing Deletion)**:
- **Goal**: Prevent orphaned listings (listings without images)
- **Risk**: Orphaned files in storage (acceptable)
- **Trade-off**: Database cleanup might fail, but user sees error
- **Use Case**: Complete entity deletion where data integrity is critical

**Database-First (Image Deletion)**:
- **Goal**: Immediate user feedback, fast response
- **Risk**: Orphaned files in storage (acceptable, will cleanup)
- **Trade-off**: User sees success even if storage cleanup pending
- **Use Case**: Partial deletion or bulk operations

### Why Accept Orphaned Files?

**Alternative Approaches Considered**:

1. **Database Schema for Orphaned Files**
   - ❌ Requires schema changes
   - ❌ Adds complexity to migrations
   - ❌ Doesn't solve the fundamental problem

2. **Synchronous Cleanup**
   - ❌ Blocks user requests
   - ❌ Slower response times
   - ❌ No benefit over async cleanup

3. **Manual Cleanup Only**
   - ❌ Requires maintenance scripts
   - ❌ Files accumulate over time
   - ❌ Operators need to remember to run cleanup

**Chosen Approach**: In-memory tracking with automatic cleanup
- ✅ No schema changes needed
- ✅ Fast response times (fire-and-forget)
- ✅ Automatic recovery from failures
- ✅ Simple implementation

### Why Fire-and-Forget Cleanup?

**Benefits**:
1. **User Experience**: Delete operations return immediately
2. **Fault Tolerance**: Cleanup failures don't affect user operations
3. **Resource Efficiency**: Cleanup runs when system has capacity
4. **Simplicity**: No need for scheduled jobs or background workers

**Trade-offs**:
- Cleanup state is lost on application restart (acceptable - will retry on next failure)
- No guaranteed cleanup time (acceptable - eventual consistency)
- Requires monitoring to ensure cleanup is working (standard operations practice)

---

## 8. Performance Considerations

**Delete Operation Performance**:
- Listing deletion: O(n) where n = number of images
- Image deletion: O(1) database transaction + O(n) MinIO deletes
- Cleanup: O(m) where m = all files in MinIO prefix

**Optimization Strategies**:
1. **AsNoTracking()**: Faster reads, less memory for queries that don't need change tracking
2. **Batching**: RemoveRange() for multiple records instead of individual removes
3. **Async/Await**: Non-blocking I/O for database and MinIO operations
4. **Fire-and-Forget**: Cleanup doesn't block request processing

**Scalability**:
- Delete operations scale linearly with number of images
- Cleanup operations can handle thousands of orphaned files
- Concurrent deletes are safe (database transactions ensure isolation)

---

## 9. Testing Strategy

### Unit Tests

**MinioFileStorageServiceTests**:
```csharp
[Fact]
public async Task DeleteImagesAsync_Listing_RemovesDbRowsAndDeletesObjects()
{
    // Verifies DB deletion happens even if MinIO succeeds
}

[Fact]
public async Task DeleteImagesAsync_WhenMinioDeleteFails_StillRemovesDbRows()
{
    // Verifies DB deletion succeeds even when MinIO fails
}
```

### Integration Tests

**ListingCommandServiceTests**:
```csharp
[Fact]
public async Task DeleteListingAsync_RemovesListingAndImages_WhenStorageSucceeds()
{
    // Verifies complete deletion with storage success
}

[Fact]
public async Task DeleteListingAsync_WhenStorageFails_DoesNotRemoveDatabaseRows()
{
    // Verifies storage-first behavior: DB unchanged if storage fails
}

[Fact]
public async Task DeleteListingAsync_WhenUserDoesNotOwnListing_ThrowsArgumentException()
{
    // Verifies authorization checks
}

[Fact]
public async Task DeleteListingAsync_WithMultipleImages_RemovesAllImagesAndListing()
{
    // Verifies bulk deletion operations
}

[Fact]
public async Task DeleteListingAsync_WithPartialStorageFailure_ThrowsInvalidOperationException()
{
    // Verifies error handling for partial failures
}
```

**Test Infrastructure**:
- Uses Testcontainers for PostgreSQL (supports real transactions)
- Mocks MinIO client for controlled failure scenarios
- Seeds minimal test data to satisfy foreign key constraints

---

## 10. Future Improvements

**Potential Enhancements**:

1. **Persistent Cleanup Queue**
   - Store pending cleanups in database or Redis
   - Survives application restarts
   - Enables better monitoring and observability

2. **Scheduled Cleanup Jobs**
   - Run comprehensive cleanup on schedule (e.g., daily)
   - Catches any orphaned files missed by event-driven cleanup
   - Can be lower priority / off-peak hours

3. **Metrics and Monitoring**
   - Track orphaned file count over time
   - Alert if cleanup consistently fails
   - Dashboard for storage efficiency

4. **Soft Deletes**
   - Keep database records marked as deleted
   - Enables undo functionality
   - Requires TTL for permanent deletion

5. **Bulk Delete API**
   - Delete multiple listings in single operation
   - More efficient for bulk operations
   - Reduces number of cleanup triggers

6. **Retry Logic**
   - Exponential backoff for failed MinIO operations
   - Increases success rate for transient failures
   - Reduces orphaned file accumulation

---

## Summary

The SwapStreet delete operations use two complementary strategies:

1. **Storage-First Delete** ensures no orphaned listings in the database
2. **Database-First Delete** ensures fast user feedback and database consistency

Both strategies gracefully handle MinIO failures through:
- Careful ordering of operations
- Database transactions for consistency
- Fire-and-forget orphaned file cleanup
- Comprehensive logging and error handling

The system prioritizes database consistency over storage consistency, accepting temporary orphaned files that are automatically cleaned up in the background.

---

**Last Updated**: February 17, 2026  
**Related Files**:
- `backend/Services/Listings/ListingCommandService.cs`
- `backend/Services/MinioFileStorageService.cs`
- `backend/Contracts/IFileStorageService.cs`
- `backend/backend.Tests/Services/MinioFileStorageServiceTests.cs`
- `backend/backend.Tests/Integration/ListingCommandServiceTests.cs`
