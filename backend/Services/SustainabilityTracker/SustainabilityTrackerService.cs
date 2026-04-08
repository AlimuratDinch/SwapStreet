using backend.Contracts;
using backend.DbContexts;
using backend.DTOs.SustainabilityTracker;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace backend.Services.SustainabilityTracker;

public class SustainabilityTrackerService : ISustainabilityTrackerService
{
    private readonly AppDbContext _context;
    static readonly Dictionary<ListingCategory, Stats> articleToStats = 
            new Dictionary<ListingCategory, Stats>();
    
    static SustainabilityTrackerService()
    {
        string stringData;
        
        using (StreamReader s = new StreamReader("./DTOs/SustainabilityTracker"))
        {
            stringData = s.ReadToEnd();
        }
        
        var root = JsonSerializer.Deserialize<ArticleData>(stringData);
        foreach (Stats s in root.Data)
        {
            Enum.TryParse(s.Name, out ListingCategory lc);
            // May throw an exception.
            
            articleToStats.Add(lc, s);
        }
    }
    
    public SustainabilityTrackerService(AppDbContext context)
    {
        _context = context;
    }
    
    readonly record struct Stats(
        String Name,
        double AvgCO2Kg, 
        double AvgWaterL, 
        double AvgElectricityKWh, 
        double AvgToxicChemicalsG);

    readonly record struct ArticleData(List<Stats> Data);
    
    public async Task<SustainabilityTrackerStatsDTO> GetSustainabilityData(Guid userId)
    {
        
        
        return null;
    }
    
    private void getArticleTypeData(Guid userId)
    {
        var chatroomData = _context.Chatrooms
            .AsNoTracking()
            .Where(c => c.SellerId == userId || c.BuyerId == userId)
            .ToList();
        
    }
    
}