using System.Text.Json.Serialization;

namespace backend.DTOs.SustainabilityTracker;

public class SustainabilityTrackerStatsDTO
{
    [JsonPropertyName("CO2Kg")]
    public double CO2Kg { get; set; }
    
    [JsonPropertyName("waterL")]
    public double WaterL { get; set; }
    
    [JsonPropertyName("electricityKWh")]
    public double ElectricityKWh { get; set; }
    
    [JsonPropertyName("toxicChemicals")]
    public double ToxicChemicalsG { get; set; }
}