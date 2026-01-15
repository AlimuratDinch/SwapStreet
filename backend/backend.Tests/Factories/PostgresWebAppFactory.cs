using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.DbContexts;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace backend.Tests.TestcontainersFixtures
{
    public class PostgresWebAppFactory : TestWebApplicationFactory
    {
        private readonly string _connectionString;

        public PostgresWebAppFactory(string connectionString)
        {
            _connectionString = connectionString
                    ?? "Host=localhost;Port=5432;Database=test_db;Username=postgres;Password=postgres";
        }

        protected override void ConfigureDatabase(IServiceCollection services)
        {
            // Add PostgreSQL databases with NetTopologySuite support
            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(_connectionString, npgsqlOptions =>
                {
                    npgsqlOptions.UseNetTopologySuite();
                    npgsqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                })
                .EnableSensitiveDataLogging()
                .EnableDetailedErrors());

            services.AddDbContext<AuthDbContext>(options =>
                options.UseNpgsql(_connectionString, npgsqlOptions =>
                {
                    npgsqlOptions.UseNetTopologySuite();
                    npgsqlOptions.MigrationsAssembly(typeof(AuthDbContext).Assembly.FullName);
                })
                .EnableSensitiveDataLogging()
                .EnableDetailedErrors());
        }
    }
}