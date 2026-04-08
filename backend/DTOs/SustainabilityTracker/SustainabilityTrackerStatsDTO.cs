using System.Text.Json.Serialization;

namespace backend.DTOs.SustainabilityTracker;

public class SustainabilityTrackerStatsDTO
{
    [JsonPropertyName("avgCO2Kg")]
    public double AvgCO2Kg { get; set; }
    
    [JsonPropertyName("avgWaterL")]
    public double AvgWaterL { get; set; }
    
    [JsonPropertyName("avgElectricityKWh")]
    public double AvgElectricityKWh { get; set; }
    
    [JsonPropertyName("avgToxicChemicals")]
    public double AvgToxicChemicalsG { get; set; }
}