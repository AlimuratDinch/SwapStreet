using CsvHelper.Configuration;
using backend.Models;

public sealed class ProvinceMap : ClassMap<Province>
{
    public ProvinceMap()
    {
        // Maps the CSV column "province_id" to the C# property Province.Code
        Map(m => m.Code).Name("province_id");

        // Maps the CSV column "province_name" to the C# property Province.Name
        Map(m => m.Name).Name("province_name");

        // Ignore the Id as it's database-generated
        Map(m => m.Id).Ignore();
    }
}