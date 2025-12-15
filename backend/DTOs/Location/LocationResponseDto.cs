namespace backend.DTOs
{
    public class LocationResponseDto
    {
        public string City { get; set; } = string.Empty;
        public string Province { get; set; } = string.Empty;
        public string ProvinceCode { get; set; } = string.Empty;
        public double Lat { get; set; }
        public double Lng { get; set; }
    }
}