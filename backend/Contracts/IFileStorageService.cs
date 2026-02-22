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
        Task<string> UploadFileAsync(IFormFile file, UploadType type, Guid userId, Guid? listingId = null);
        Task<string> GetPrivateFileUrlAsync(string fileName, int expiryInSeconds = 3600);
        string GetPublicFileUrl(string fileName);
        Task<string> UploadImageInternalAsync(IFormFile file, UploadType type);
        Task<bool> HasImagesInPublicBucketAsync();
    }
}