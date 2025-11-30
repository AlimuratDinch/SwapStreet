using CsvHelper.Configuration;

public sealed class CityMap : ClassMap<CityImportDto>
{
    public CityMap()
    {
        // 1. Simple mappings
        Map(m => m.Name).Name("city_ascii");
        Map(m => m.ProvinceCode).Name("province_id");
        Map(m => m.Latitude).Name("lat");
        Map(m => m.Longitude).Name("lng");
        
        // 2. Map the raw postal string (we will split this later in the loop)
        Map(m => m.FsaCodes).Name("postal");
    }
}