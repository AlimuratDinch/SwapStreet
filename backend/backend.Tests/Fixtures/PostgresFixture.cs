using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;
using Xunit;
using backend.DbContexts;
using System.Threading.Tasks;
using System;
using Microsoft.Extensions.DependencyInjection;

namespace backend.Tests.Fixtures;

public sealed class PostgresFixture : IAsyncLifetime
{
    public PostgreSqlContainer Container { get; } =
            new PostgreSqlBuilder("postgis/postgis:16-3.4") // or your version
            .WithDatabase("testdb")
            .WithUsername("postgres")
            .WithPassword("postgres")
            .Build();

    public DbContextOptions<AppDbContext> DbOptions { get; private set; } = default!;
    public DbContextOptions<AuthDbContext> AuthDbOptions { get; private set; } = default!;

    public async Task InitializeAsync()
    {
        await Container.StartAsync();

        var connectionString = Container.GetConnectionString();

        DbOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString, o => o.UseNetTopologySuite())
            .Options;

        AuthDbOptions = new DbContextOptionsBuilder<AuthDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        // Delete and recreate AppDbContext database for tests
        using (var db = new AppDbContext(DbOptions))
        {
            await db.Database.EnsureDeletedAsync();
            // Use EnsureCreated in tests to avoid requiring EF migrations during model changes
            await db.Database.EnsureCreatedAsync();
        }

        // Ensure AuthDbContext schema is created for tests
        using var authDb = new AuthDbContext(AuthDbOptions);
        await authDb.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync() => await Container.DisposeAsync();
}
