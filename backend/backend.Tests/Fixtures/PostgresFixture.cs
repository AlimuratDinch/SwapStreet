using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;
using Xunit;
using backend.DbContexts;
using System.Threading.Tasks;
using System;

namespace backend.Tests.Fixtures;

public sealed class PostgresFixture : IAsyncLifetime
{
    public PostgreSqlContainer Container { get; } =
            new PostgreSqlBuilder("postgres:latest") // or your version
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
            .UseNpgsql(connectionString)
            .Options;

        AuthDbOptions = new DbContextOptionsBuilder<AuthDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        // Delete and recreate AppDbContext database
        using (var db = new AppDbContext(DbOptions))
        {
            await db.Database.EnsureDeletedAsync();
            await db.Database.MigrateAsync();
        }

        // Ensure AuthDbContext schema is created (don't delete since it shares the same database)
        using var authDb = new AuthDbContext(AuthDbOptions);
        await authDb.Database.MigrateAsync();
    }

    public async Task DisposeAsync() => await Container.DisposeAsync();
}
