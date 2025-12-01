namespace backend.DTOs.Location
{
    public class CityDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int ProvinceId { get; set; }
    }
}
