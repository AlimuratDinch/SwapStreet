using Microsoft.EntityFrameworkCore;
using backend.DbContexts;

namespace backend.Tests.Data;
public class TestAppDbContext(DbContextOptions<TestAppDbContext> options) : AppDbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Listing>().Ignore(l => l.SearchVector);
    }
}