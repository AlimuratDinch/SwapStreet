using AwesomeAssertions;
using backend.Contracts;
using backend.DbContexts;
using backend.DTOs.SustainabilityTracker;
using backend.Models;
using backend.Services.SustainabilityTracker;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Threading.Tasks;
using Xunit;

namespace backend.Tests;

public class SustainabilityTrackerTests : IDisposable
{
    private static readonly Stats _outerwear = new Stats
    {
        AvgCO2Kg = 1.0M,
        AvgWaterL = 2.0M,
        AvgElectricityKWh = 3.0M,
        AvgToxicChemicalsG = 4.0M,
        AvgLandfillKg = 5.0M
    }, _formalwear = new Stats
    {
        AvgCO2Kg = 0.5M,
        AvgWaterL = 1.5M,
        AvgElectricityKWh = 2.5M,
        AvgToxicChemicalsG = 3.5M,
        AvgLandfillKg = 4.5M
    };
    private static readonly string jsonData = @"
        {
            ""Data"": [
                {
                    ""Name"": ""Bottoms"",
                    ""AvgCO2Kg"": 25,
                    ""AvgWaterL"": 5000,
                    ""AvgElectricityKWh"": 25,
                    ""AvgToxicChemicalsG"": 120,
                    ""AvgLandfillKg"": 1.0
                },
                {
                    ""Name"": ""Tops"",
                    ""AvgCO2Kg"": 12.5,
                    ""AvgWaterL"": 2850,
                    ""AvgElectricityKWh"": 15,
                    ""AvgToxicChemicalsG"": 80,
                    ""AvgLandfillKg"": 1.0
                },
                {
                    ""Name"": ""Footwear"",
                    ""AvgCO2Kg"": 30,
                    ""AvgWaterL"": 4000,
                    ""AvgElectricityKWh"": 35,
                    ""AvgToxicChemicalsG"": 150,
                    ""AvgLandfillKg"": 1.0
                },
                {
                    ""Name"": ""Accessory"",
                    ""AvgCO2Kg"": 5.5,
                    ""AvgWaterL"": 1000,
                    ""AvgElectricityKWh"": 7.5,
                    ""AvgToxicChemicalsG"": 30,
                    ""AvgLandfillKg"": 1.0
                },
                {
                    ""Name"": ""Outerwear"",
                    ""AvgCO2Kg"": " + _outerwear.AvgCO2Kg + @",
                    ""AvgWaterL"": " + _outerwear.AvgWaterL + @",
                    ""AvgElectricityKWh"": " + _outerwear.AvgElectricityKWh + @",
                    ""AvgToxicChemicalsG"": " + _outerwear.AvgToxicChemicalsG + @",
                    ""AvgLandfillKg"": " + _outerwear.AvgLandfillKg + @"
                },
                {
                    ""Name"": ""Formalwear"",
                    ""AvgCO2Kg"": " + _formalwear.AvgCO2Kg + @",
                    ""AvgWaterL"": " + _formalwear.AvgWaterL + @",
                    ""AvgElectricityKWh"": " + _formalwear.AvgElectricityKWh + @",
                    ""AvgToxicChemicalsG"": " + _formalwear.AvgToxicChemicalsG + @",
                    ""AvgLandfillKg"":  " + _formalwear.AvgLandfillKg + @"
                },
                {
                    ""Name"": ""Sportswear"",
                    ""AvgCO2Kg"": 11.5,
                    ""AvgWaterL"": 2500,
                    ""AvgElectricityKWh"": 17.5,
                    ""AvgToxicChemicalsG"": 90,
                    ""AvgLandfillKg"": 1.0
                }
            ]
        }";

    private readonly AppDbContext _db;
    private readonly ISustainabilityTrackerService _service;
    private readonly Guid _userAId = Guid.NewGuid(),
        _userBId = Guid.NewGuid(),
        _userCId = Guid.NewGuid(),
        _userDId = Guid.NewGuid();

    public SustainabilityTrackerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _db = new AppDbContext(options);

        string source = Path.Combine(
            System.IO.Directory.GetCurrentDirectory(),
            @"testSustainabilityData.json"
        );

        using (StreamWriter s = new StreamWriter(source))
        {
            s.Write(jsonData);
        }

        _service = new SustainabilityTrackerService(
            _db,
            source
        );

        SeedTestData();
    }

    public void Dispose()
    {
        _db.Database.EnsureDeleted();
        _db.Dispose();
    }

    private readonly record struct Stats(
        decimal AvgCO2Kg,
        decimal AvgWaterL,
        decimal AvgElectricityKWh,
        decimal AvgToxicChemicalsG,
        decimal AvgLandfillKg
    );

    [Fact]
    public async Task GetSustainabilityData_GetSustainabilityData()
    {
        // Arrange
        SustainabilityVector sva = new SustainabilityVector
        {
            CO2Kg = _outerwear.AvgCO2Kg + _formalwear.AvgCO2Kg,
            WaterL = _outerwear.AvgWaterL + _formalwear.AvgWaterL,
            ElectricityKWh = _outerwear.AvgElectricityKWh + _formalwear.AvgElectricityKWh,
            ToxicChemicalsG = _outerwear.AvgToxicChemicalsG + _formalwear.AvgToxicChemicalsG,
            LandfillKg = _outerwear.AvgLandfillKg + _formalwear.AvgLandfillKg,
            UserId = _userAId
        };

        _db.SustainabilityVectors.Add(sva);
        _db.SaveChanges();

        // Act
        SustainabilityTrackerStatsDTO dto = await _service.GetSustainabilityData(_userAId);

        // Assert
        dto.CO2Kg.Should().Be(_outerwear.AvgCO2Kg + _formalwear.AvgCO2Kg);
        dto.WaterL.Should().Be(_outerwear.AvgWaterL + _formalwear.AvgWaterL);
        dto.ElectricityKWh.Should().Be(_outerwear.AvgElectricityKWh + _formalwear.AvgElectricityKWh);
        dto.ToxicChemicalsG.Should().Be(_outerwear.AvgToxicChemicalsG + _formalwear.AvgToxicChemicalsG);
        dto.LandfillKg.Should().Be(_outerwear.AvgLandfillKg + _formalwear.AvgLandfillKg);
    }

    [Fact]
    public async Task GetGlobalSustainabilityData_SumsImpactsOfIndividualPurchases()
    {
        SustainabilityVector sva = new SustainabilityVector
        {
            CO2Kg = 1.0M,
            WaterL = 2.0M,
            ElectricityKWh = 3.0M,
            ToxicChemicalsG = 4.0M,
            LandfillKg = 5.0M,
            UserId = _userAId
        }, svb = new SustainabilityVector
        {
            CO2Kg = 1.0M,
            WaterL = 2.0M,
            ElectricityKWh = 3.0M,
            ToxicChemicalsG = 4.0M,
            LandfillKg = 5.0M,
            UserId = _userBId
        }, svc = new SustainabilityVector
        {
            CO2Kg = 1.1M,
            WaterL = 2.1M,
            ElectricityKWh = 3.1M,
            ToxicChemicalsG = 4.1M,
            LandfillKg = 5.1M,
            UserId = _userCId
        };

        _db.SustainabilityVectors.AddRange(sva, svb, svc);
        _db.SaveChanges();

        // Act
        SustainabilityTrackerStatsDTO dto = await _service.GetGlobalSustainabilityData();

        // Assert
        dto.CO2Kg.Should().Be(3.1M);
        dto.WaterL.Should().Be(6.1M);
        dto.ElectricityKWh.Should().Be(9.1M);
        dto.ToxicChemicalsG.Should().Be(12.1M);
        dto.LandfillKg.Should().Be(15.1M);
    }

    private void SeedTestData()
    {
        int provinceId = 1, cityId = 1;

        var province = new Province
        {
            Id = provinceId,
            Name = "Ontario",
            Code = "ON"
        };
        _db.Provinces.Add(province);

        var city = new City
        {
            Id = cityId,
            Name = "Toronto",
            ProvinceId = provinceId
        };
        _db.Cities.Add(city);

        Profile profileA = new Profile
        {
            Id = _userAId,
            FirstName = "User",
            LastName = "A",
            CityId = cityId,
            FSA = "M5V",
            Status = ProfileStatusEnum.Online
        }, profileB = new Profile
        {
            Id = _userBId,
            FirstName = "User",
            LastName = "B",
            CityId = cityId,
            FSA = "M5V",
            Status = ProfileStatusEnum.Online
        }, profileC = new Profile
        {
            Id = _userCId,
            FirstName = "User",
            LastName = "C",
            CityId = cityId,
            FSA = "M5V",
            Status = ProfileStatusEnum.Online
        }, profileD = new Profile
        {
            Id = _userDId,
            FirstName = "User",
            LastName = "D",
            CityId = cityId,
            FSA = "M5V",
            Status = ProfileStatusEnum.Online
        };

        _db.Profiles.AddRange(profileA, profileB, profileC);

        Guid listingAId = Guid.NewGuid(),
            listingBId = Guid.NewGuid(),
            listingCId = Guid.NewGuid(),
            listingDId = Guid.NewGuid();

        Listing listingA = new Listing
        {
            Id = listingAId,
            Category = ListingCategory.Outerwear
        }, listingB = new Listing
        {
            Id = listingBId,
            Category = ListingCategory.Formalwear
        }, listingC = new Listing
        {
            Id = listingCId,
            Category = ListingCategory.Formalwear
        }, listingD = new Listing
        {
            Id = listingDId,
            Category = ListingCategory.Formalwear
        };
        _db.Listings.AddRange(listingA, listingB, listingC, listingD);

        Chatroom chatroomA = new Chatroom
        {
            Id = Guid.NewGuid(),
            SellerId = _userAId,
            BuyerId = _userBId,
            CreationTime = DateTimeOffset.UtcNow,
            Listing = listingA,
            ListingId = listingAId,
            IsDealClosed = true,
            ClosedAt = DateTimeOffset.UtcNow
        }, chatroomB = new Chatroom
        {
            Id = Guid.NewGuid(),
            SellerId = _userBId,
            BuyerId = _userAId,
            CreationTime = DateTimeOffset.UtcNow,
            Listing = listingB,
            ListingId = listingBId,
            IsDealClosed = true,
            ClosedAt = DateTimeOffset.UtcNow
        }, chatroomC = new Chatroom
        {
            Id = Guid.NewGuid(),
            SellerId = _userCId,
            BuyerId = _userDId,
            CreationTime = DateTimeOffset.UtcNow,
            Listing = listingC,
            ListingId = listingCId,
            IsDealClosed = false,
            ClosedAt = DateTimeOffset.UtcNow
        }, chatroomD = new Chatroom
        {
            Id = Guid.NewGuid(),
            SellerId = _userDId,
            BuyerId = _userCId,
            CreationTime = DateTimeOffset.UtcNow,
            Listing = listingD,
            ListingId = listingDId,
            IsDealClosed = true,
            ClosedAt = DateTimeOffset.UtcNow
        };

        _db.Chatrooms.AddRange(chatroomA, chatroomB, chatroomC, chatroomD);

        _db.SaveChanges();
    }

}