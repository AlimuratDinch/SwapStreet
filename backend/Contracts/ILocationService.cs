using backend.Models;

namespace backend.Contracts
{
    public interface ILocationService
    {
        //Find location from postal code (FSA)
        Task<City?> GetCityByFsaAsync(string fsaCode);

        // 2. Dropdown Data: Get all provinces
        Task<IEnumerable<Province>> GetAllProvincesAsync();

        // 3. Dropdown Data: Get cities for a specific province
        Task<IEnumerable<City>> GetCitiesByProvinceIdAsync(int provinceId);

        //Validation: Check if an FSA exists
        Task<bool> IsValidFsaAsync(string fsaCode);
    }
}