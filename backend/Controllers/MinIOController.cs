using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Minio;
using Minio.DataModel.Args;
using Microsoft.Extensions.Options;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/img")]
    public class UploadController : ControllerBase
    {
        private readonly IMinioClient _minio;
        private readonly MinioSettings _settings;

        public UploadController(IMinioClient minio, IOptions<MinioSettings> settings)
        {
            _minio = minio;
            _settings = settings.Value;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var fileName = $"{Guid.NewGuid()}_{file.FileName}";

            // Upload to MinIO
            using var stream = file.OpenReadStream();
            await _minio.PutObjectAsync(new PutObjectArgs()
                .WithBucket(_settings.BucketName)
                .WithObject(fileName)
                .WithStreamData(stream)
                .WithObjectSize(file.Length)
                .WithContentType(file.ContentType));

            // Generate a pre-signed URL for frontend access
            var fileUrl = await _minio.PresignedGetObjectAsync(new PresignedGetObjectArgs()
                .WithBucket(_settings.BucketName)
                .WithObject(fileName)
                .WithExpiry(60 * 60));// 1 hour expiry

            return Ok(new
            {
                fileName,
                url = fileUrl
            });
        }
    }
}
