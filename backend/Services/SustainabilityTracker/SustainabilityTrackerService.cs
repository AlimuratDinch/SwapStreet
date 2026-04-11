using backend.Contracts;
using backend.DbContexts;
using backend.DTOs.SustainabilityTracker;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace backend.Services.SustainabilityTracker;

public class SustainabilityTrackerService : ISustainabilityTrackerService
{
    private readonly AppDbContext _context;
    private readonly Dictionary<ListingCategory, Stats> listingTypeToStats =
        new Dictionary<ListingCategory, Stats>();

    public SustainabilityTrackerService(AppDbContext context)
        : this(context, getDataPath())
    {

    }

    private static string getDataPath()
    {
        return Path.Combine(
            AppContext.BaseDirectory,
            "Services",
            "SustainabilityTracker",
            "sustainabilityData.json"
        );
    }

    public SustainabilityTrackerService(AppDbContext context, string source)
    {
        _context = context;

        if (!File.Exists(source))
        {
            throw new FileNotFoundException(
                $"Sustainability data file was not found at '{source}'.",
                source
            );
        }

        string jsonData;

        using (StreamReader s = new StreamReader(source))
        {
            jsonData = s.ReadToEnd();
        }

        var root = JsonSerializer.Deserialize<ArticleData>(jsonData);
        // May throw an exception if JSON is bad.

        try
        {
            foreach (Stats s in root.Data)
            {
                ListingCategory lc = (ListingCategory)Enum.Parse(
                    typeof(ListingCategory),
                    s.Name
                );
                // May throw an exception for a bad JSON file.

                listingTypeToStats.Add(lc, s);
            }
        }
        catch (ArgumentException ex)
        {
            string errorMessage = "Listing categories in `ListingCategory` "
                + "enumeration and in sustainability data JSON do not match.";

            throw new ArgumentException(errorMessage);
        }

    }

    private record Stats(
        String Name,
        decimal AvgCO2Kg,
        decimal AvgWaterL,
        decimal AvgElectricityKWh,
        decimal AvgToxicChemicalsG,
        decimal AvgLandfillKg);

    private readonly record struct ArticleData(List<Stats> Data);

    public async Task<SustainabilityTrackerStatsDTO> GetSustainabilityData(Guid userId)
    {
        SustainabilityVector? sv = _context.SustainabilityVectors
            .AsNoTracking()
            .FirstOrDefault(sv => sv.UserId == userId);

        if (sv == null)
        {
            return new SustainabilityTrackerStatsDTO();
        }

        SustainabilityTrackerStatsDTO dto = new SustainabilityTrackerStatsDTO
        {
            CO2Kg = sv.CO2Kg,
            WaterL = sv.WaterL,
            ElectricityKWh = sv.ElectricityKWh,
            ToxicChemicalsG = sv.ToxicChemicalsG,
            LandfillKg = sv.LandfillKg,
            Articles = sv.Articles
        };

        return dto;
    }

    public async Task<SustainabilityTrackerStatsDTO> GetGlobalSustainabilityData()
    {
        decimal co2Kg = _context.SustainabilityVectors
            .AsNoTracking()
            .Select(sv => sv.CO2Kg)
            .Sum();
        decimal waterL = _context.SustainabilityVectors
            .AsNoTracking()
            .Select(sv => sv.WaterL)
            .Sum();
        decimal electricityKWh = _context.SustainabilityVectors
            .AsNoTracking()
            .Select(sv => sv.ElectricityKWh)
            .Sum();
        decimal toxicChemicalsG = _context.SustainabilityVectors
            .AsNoTracking()
            .Select(sv => sv.ToxicChemicalsG)
            .Sum();
        decimal landfillKg = _context.SustainabilityVectors
            .AsNoTracking()
            .Select(sv => sv.LandfillKg)
            .Sum();
        int articles = _context.SustainabilityVectors
            .AsNoTracking()
            .Select(sv => sv.Articles)
            .Sum();

        SustainabilityTrackerStatsDTO dto = new SustainabilityTrackerStatsDTO
        {
            CO2Kg = co2Kg,
            WaterL = waterL,
            ElectricityKWh = electricityKWh,
            ToxicChemicalsG = toxicChemicalsG,
            LandfillKg = landfillKg,
            Articles = articles / 2
        };

        return dto;
    }

    public void UpdateWith(Guid buyerId, Guid sellerId, Listing listing)
    {
        SustainabilityVector? svBuyer = _context.SustainabilityVectors
            .FirstOrDefault(sv => sv.UserId == buyerId);

        if (svBuyer == null)
        {
            svBuyer = new SustainabilityVector { UserId = buyerId };
            _context.SustainabilityVectors.Add(svBuyer);
        }

        SustainabilityVector? svSeller = _context.SustainabilityVectors
            .FirstOrDefault(sv => sv.UserId == sellerId);

        if (svSeller == null)
        {
            svSeller = new SustainabilityVector { UserId = sellerId };
            _context.SustainabilityVectors.Add(svSeller);
        }

        ReadOnlySpan<SustainabilityVector> vectorData = new[]
        {
            svBuyer,
            svSeller
        };

        Stats stats = listingTypeToStats[listing.Category];
        foreach (var vector in vectorData)
        {
            vector.CO2Kg += stats.AvgCO2Kg;
            vector.WaterL += stats.AvgWaterL;
            vector.ElectricityKWh += stats.AvgElectricityKWh;
            vector.ToxicChemicalsG += stats.AvgToxicChemicalsG;
            vector.LandfillKg += stats.AvgLandfillKg;
        }

        ++svSeller.Articles;
        ++svBuyer.Articles;
        ++svSeller.Articles;

        _context.SaveChanges();

    }

}