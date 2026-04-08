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
            @"..",
            @"..",
            @"..",
            @"Services",
            @"SustainabilityTracker",
            @"sustainabilityData.json"
        );
    }
    
    public SustainabilityTrackerService(AppDbContext context, string source)
    {
        _context = context;
        
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
                ListingCategory lc = (ListingCategory) Enum.Parse(
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
        double AvgCO2Kg, 
        double AvgWaterL, 
        double AvgElectricityKWh, 
        double AvgToxicChemicalsG);

    private readonly record struct ArticleData(List<Stats> Data);
    
    public async Task<SustainabilityTrackerStatsDTO> GetSustainabilityData(Guid userId)
    {
        List<ListingCategory> data = getListingCategoryDataFromUser(userId);
        
        return sumMetricData(data);
    }
    
    public async Task<List<SustainabilityTrackerStatsDTO>> GetGlobalSustainabilityData()
    {
        List<SustainabilityTrackerStatsDTO> data = new List<SustainabilityTrackerStatsDTO>();
        List<ListingCategory> categoryData = _context.Chatrooms
            .AsNoTracking()
            .Where(c => c.IsDealClosed)
            .Select(
                c => c.Listing.Category
            ).ToList();
        
        data.Add(sumMetricData(categoryData));
        
        return data;
    }
    
    private List<ListingCategory> getListingCategoryDataFromUser(Guid userId)
    {
        var categoryData = _context.Chatrooms
            .AsNoTracking()
            .Where(c => c.SellerId == userId || c.BuyerId == userId)
            .Join(
                _context.Listings,
                c => c.ListingId,
                l => l.Id,
                (chatroom, listing) => listing.Category
            ).ToList();
        
        return categoryData;
    }
    
    private SustainabilityTrackerStatsDTO sumMetricData(List<ListingCategory> data)
    {
        SustainabilityTrackerStatsDTO dto = new SustainabilityTrackerStatsDTO();
        
        foreach (ListingCategory lc in data)
        {
            Stats stats = listingTypeToStats[lc];
            
            dto.CO2Kg += stats.AvgCO2Kg;
            dto.WaterL += stats.AvgWaterL;
            dto.ElectricityKWh += stats.AvgElectricityKWh;
            dto.ToxicChemicalsG += stats.AvgToxicChemicalsG;
        }
        
        return dto;
    }
    
}