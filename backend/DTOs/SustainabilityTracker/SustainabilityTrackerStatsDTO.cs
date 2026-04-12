using System.Text.Json.Serialization;

namespace backend.DTOs.SustainabilityTracker;

public class SustainabilityTrackerStatsDTO
{
    [JsonPropertyName("CO2Kg")]
    public decimal CO2Kg { get; set; }

    [JsonPropertyName("waterL")]
    public decimal WaterL { get; set; }

    [JsonPropertyName("electricityKWh")]
    public decimal ElectricityKWh { get; set; }

    [JsonPropertyName("toxicChemicals")]
    public decimal ToxicChemicalsG { get; set; }

    [JsonPropertyName("landfillKg")]
    public decimal LandfillKg { get; set; }

    [JsonPropertyName("articles")]
    public int Articles { get; set; }
}