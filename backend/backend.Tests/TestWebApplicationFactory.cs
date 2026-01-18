using System;
using System.IO;
using backend;
using backend.DbContexts;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions; // Required for RemoveAll
using System.Linq;

namespace backend.Tests;

public abstract class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    protected abstract void ConfigureDatabase(IServiceCollection services);

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        var contentRoot = GetProjectPath();
        builder.UseContentRoot(contentRoot);

        // 1. Force Environment to Test so Program.cs skips its DB logic
        builder.UseEnvironment("Test");

        // 2. Mock necessary Environment Variables
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Test");
        Environment.SetEnvironmentVariable("JWT_SECRET", "test-secret-key-minimum-32-chars-long!");
        Environment.SetEnvironmentVariable("GEMINI_API_KEY", "test-gemini-key");
        Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", "Host=localhost;Database=dummy");

        builder.ConfigureServices(services =>
        {
            RemoveAllDbContexts(services);

            ConfigureDatabase(services);

            EnsureDatabaseCreated(services);
        });
    }

    private void RemoveAllDbContexts(IServiceCollection services)
    {
        // Use RemoveAll for safety
        services.RemoveAll(typeof(DbContextOptions<AppDbContext>));
        services.RemoveAll(typeof(AppDbContext));
        services.RemoveAll(typeof(DbContextOptions<AuthDbContext>));
        services.RemoveAll(typeof(AuthDbContext));
    }

    private void EnsureDatabaseCreated(IServiceCollection services)
    {
        var sp = services.BuildServiceProvider();
        using var scope = sp.CreateScope();
        var scopedServices = scope.ServiceProvider;

        // Force creation of both contexts
        var appDb = scopedServices.GetRequiredService<AppDbContext>();
        var authDb = scopedServices.GetRequiredService<AuthDbContext>();

        appDb.Database.EnsureCreated();
        authDb.Database.EnsureCreated();
    }

    private string GetProjectPath()
    {
        var startupAssembly = typeof(Program).Assembly;
        var projectName = startupAssembly.GetName().Name;
        var directoryInfo = new DirectoryInfo(AppContext.BaseDirectory);

        while (directoryInfo.Parent != null)
        {
            var projectDirectory = Path.Combine(directoryInfo.FullName, projectName);
            if (Directory.Exists(projectDirectory)) return projectDirectory;
            if (File.Exists(Path.Combine(directoryInfo.FullName, $"{projectName}.csproj"))) return directoryInfo.FullName;
            directoryInfo = directoryInfo.Parent;
        }
        throw new DirectoryNotFoundException($"Could not locate project directory for '{projectName}'");
    }
}