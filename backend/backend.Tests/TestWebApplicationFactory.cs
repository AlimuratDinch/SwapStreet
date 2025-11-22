using backend;
using backend.DbContexts;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Linq;

namespace backend.Tests
{
    public class BackendTestFactory<TProgram> : WebApplicationFactory<TProgram> where TProgram : class
    {
                             protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                // Replace AppDbContext with in-memory
                var appDbDescriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (appDbDescriptor != null) services.Remove(appDbDescriptor);

                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestAppDb");
                });

                // Replace AuthDbContext with in-memory
                var authDbDescriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AuthDbContext>));
                if (authDbDescriptor != null) services.Remove(authDbDescriptor);

                services.AddDbContext<AuthDbContext>(options =>
                                 {
                    options.UseInMemoryDatabase("TestAuthDb");
                });
            });

        }


    }
}
