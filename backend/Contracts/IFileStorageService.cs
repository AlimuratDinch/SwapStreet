using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using backend.DTOs.Image;

namespace backend.Contracts
{
    public interface IFileStorageService
    {
        Task<string> UploadFileAsync(IFormFile file, UploadType type, Guid userId, Guid? listingId = null, int displayOrder = 0);
        Task<string> GetPrivateFileUrlAsync(string fileName, int expiryInSeconds = 3600);
        string GetPublicFileUrl(string fileName);

        Task<string> UploadImageInternalAsync(IFormFile file, UploadType type);
        Task<bool> HasImagesInPublicBucketAsync();

        /// <summary>
        /// Deletes images from MinIO and the appropriate database table based on the type and ID.
        /// </summary>
        /// <param name="type">The type of images to determine which database table to delete from</param>
        /// <param name="listingId">The listing ID (required for Listing and Generated types)</param>
        /// <param name="profileId">The profile ID (required for TryOn type)</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <exception cref="ArgumentException">Thrown when required ID is missing for the image type</exception>
        Task DeleteImagesAsync(UploadType type, Guid? listingId = null, Guid? profileId = null, CancellationToken cancellationToken = default);

        /// <summary>
        /// Deletes objects from MinIO without touching database records.
        /// </summary>
        /// <param name="type">The image type to select the bucket</param>
        /// <param name="filePaths">Object keys to delete</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Object keys that failed to delete</returns>
        Task<IReadOnlyCollection<string>> DeleteFilesAsync(
            UploadType type,
            IEnumerable<string> filePaths,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Deletes objects from MinIO that no longer exist in the database for the given image type.
        /// </summary>
        /// <param name="type">The image type to scan and clean</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Number of deleted orphaned objects</returns>
        Task<int> CleanupOrphanedFilesAsync(UploadType type, CancellationToken cancellationToken = default);
    }
}