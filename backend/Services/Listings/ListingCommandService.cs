using Microsoft.EntityFrameworkCore;
using backend.DbContexts;
using backend.Contracts;
using backend.Models;

namespace backend.Services;

public class ListingCommandService : IListingCommandService
{
    private readonly AppDbContext _db;

    public ListingCommandService(AppDbContext db)
    {
        _db = db;
    }

    
}



