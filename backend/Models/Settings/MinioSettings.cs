using System;

namespace backend.Models
{
    public class MinioSettings
    {
        public string Endpoint { get; set; } = "minio:9000";
        public string AccessKey { get; set; } = "minioadmin";
        public string SecretKey { get; set; } = "minioadmin";
        public string PublicBucketName { get; set; } = "public";
        public string PrivateBucketName { get; set; } = "private";
        public bool WithSSL { get; set; } = false;
    }
}