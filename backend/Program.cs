using Microsoft.EntityFrameworkCore;
using backend.DbContexts;
using backend.Contracts;
using backend.Services;
using backend.Services.Auth;
using backend.Contracts.Auth;

var builder = WebApplication.CreateBuilder(args);

// Add environment variables to configuration
builder.Configuration.AddEnvironmentVariables();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder.WithOrigins("http://localhost:3000")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

// Check for dev flag
var useInMemory = Environment.GetEnvironmentVariable("USE_INMEMORY_DB") == "true";

// Configure EF Core depending on flag
if (useInMemory)
{
    Console.WriteLine("Using in-memory database (dev mode)");

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseInMemoryDatabase("AppDb"));
    builder.Services.AddDbContext<AuthDbContext>(options =>
        options.UseInMemoryDatabase("AuthDb"));
}
else
{
    // Build Postgres connection string from environment variables
    var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection") 
                       ?? throw new InvalidOperationException("Connection string not set.");

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connectionString));
    builder.Services.AddDbContext<AuthDbContext>(options =>
        options.UseNpgsql(connectionString));
}

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();

// Register services
builder.Services.AddScoped<ICatalogService, CatalogService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();

builder.WebHost.UseUrls("http://0.0.0.0:8080/");

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    try
    {
        var appDb = services.GetRequiredService<AppDbContext>();
        var authDb = services.GetRequiredService<AuthDbContext>();

        if (!useInMemory)
        {
            // Migrate real DB
            appDb.Database.Migrate();
            authDb.Database.Migrate();
            Console.WriteLine("Database migrations applied successfully.");
        }
        else
        {
            Console.WriteLine("Skipping migrations (in-memory mode)");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database initialization failed: {ex.Message}");
    }
}

// Enable Swagger
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Backend API V1");
    c.RoutePrefix = string.Empty;
});

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.MapControllers();

await app.RunAsync();

public partial class Program { }
