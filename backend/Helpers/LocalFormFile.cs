using Microsoft.AspNetCore.Http;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace backend.Helpers
{
    public class LocalFormFile : IFormFile
    {
        private readonly FileInfo _fileInfo;
        private readonly string _contentType;

        public LocalFormFile(string filePath, string contentType = "image/jpeg")
        {
            _fileInfo = new FileInfo(filePath);
            _contentType = contentType;
        }

        public string ContentType => _contentType;
        public string ContentDisposition => $"form-data; name=\"file\"; filename=\"{_fileInfo.Name}\"";
        public IHeaderDictionary Headers => new HeaderDictionary();
        public long Length => _fileInfo.Length;
        public string Name => "file";
        public string FileName => _fileInfo.Name;
        public Stream OpenReadStream() => _fileInfo.OpenRead();
        public void CopyTo(Stream target) { using var stream = _fileInfo.OpenRead(); stream.CopyTo(target); }
        public async Task CopyToAsync(Stream target, CancellationToken cancellationToken = default) { using var stream = _fileInfo.OpenRead(); await stream.CopyToAsync(target, cancellationToken); }
    }
}