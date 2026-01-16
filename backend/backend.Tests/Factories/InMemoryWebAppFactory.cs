using System;
using backend.DbContexts;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace backend.Tests.BackendTestFactories
{
    public class InMemoryWebAppFactory : TestWebApplicationFactory
    {
        private readonly string _databaseName;

        public InMemoryWebAppFactory()
        {
            _databaseName = Guid.NewGuid().ToString();
        }

        protected override void ConfigureDatabase(IServiceCollection services)
        {
            // AppDbContext
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase($"TestAppDb_{_databaseName}")
                       .EnableSensitiveDataLogging()
                       .EnableDetailedErrors()
                       .ConfigureWarnings(x => x.Ignore(InMemoryEventId.TransactionIgnoredWarning));
            });

            // AuthDbContext
            services.AddDbContext<AuthDbContext>(options =>
            {
                options.UseInMemoryDatabase($"TestAuthDb_{_databaseName}")
                       .EnableSensitiveDataLogging()
                       .EnableDetailedErrors()
                       .ConfigureWarnings(x => x.Ignore(InMemoryEventId.TransactionIgnoredWarning));
            });
        }
    }
}