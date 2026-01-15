using System;
using System.Threading.Tasks;
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Configurations;
using DotNet.Testcontainers.Containers;
using Npgsql;
using Xunit;

namespace backend.Tests.TestcontainersFixtures
{
    public class PostgresContainerFixture : IAsyncLifetime
    {
        public PostgreSqlTestcontainer Container { get; }
        public string ConnectionString => Container.ConnectionString;

        public PostgresContainerFixture()
        {
            Container = new TestcontainersBuilder<PostgreSqlTestcontainer>()
                .WithDatabase(new PostgreSqlTestcontainerConfiguration
                {
                    Database = "testdb",
                    Username = "postgres",
                    Password = "postgres"
                })
                .WithImage("postgis/postgis:16-3.4")
                .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(5432))
                .Build();
        }

        public async Task InitializeAsync()
        {
            await Container.StartAsync();

            // Enable required PostgreSQL extensions
            await using var connection = new NpgsqlConnection(Container.ConnectionString);
            await connection.OpenAsync();

            await using var command = new NpgsqlCommand(@"
            CREATE EXTENSION IF NOT EXISTS postgis;
            CREATE EXTENSION IF NOT EXISTS pg_trgm;
        ", connection);

            await command.ExecuteNonQueryAsync();
        }

        public async Task DisposeAsync()
        {
            await Container.StopAsync();
            await Container.DisposeAsync();
        }
    }
}