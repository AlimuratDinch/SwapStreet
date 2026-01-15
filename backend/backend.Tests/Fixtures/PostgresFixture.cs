using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;
using Xunit;
using backend.DbContexts;

namespace backend.Tests.Fixtures;

public sealed class PostgresFixture : IAsyncLifetime
{
    public PostgreSqlContainer Container { get; } =
        new PostgreSqlBuilder("postgres:16")
            .WithDatabase("testdb")
            .WithUsername("postgres")
            .WithPassword("postgres")
            .Build();

    public DbContextOptions<AppDbContext> DbOptions { get; private set; } = default!;

    public async Task InitializeAsync()
    {
        await Container.StartAsync();

        DbOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(Container.GetConnectionString())
            .Options;

        // Create schema from migrations (recommended vs EnsureCreated for extensions/indexes)
        using var db = new AppDbContext(DbOptions);
        await db.Database.MigrateAsync();
    }

    public async Task DisposeAsync() => await Container.DisposeAsync();
}
