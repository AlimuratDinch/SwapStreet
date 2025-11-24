using backend.DTOs.Location;

namespace backend.Contracts
{
    public interface ILocationService
    {
        Task<IEnumerable<ProvinceDto>> GetAllProvincesAsync();
        Task<IEnumerable<CityDto>> GetCitiesByProvinceAsync(int provinceId);
    }
}
