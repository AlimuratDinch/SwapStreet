using Microsoft.EntityFrameworkCore;
using backend.DbContexts;
using backend.Contracts;
using backend.Services;
// using dotenv.net;

// // Load .env file
// DotEnv.Load(new DotEnvOptions(
//     envFilePaths: new[] { Path.Combine(Directory.GetCurrentDirectory(), ".env") }
// ));

var builder = WebApplication.CreateBuilder(args);

// Add environment variables to configuration
builder.Configuration.AddEnvironmentVariables();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder.WithOrigins("http://localhost:3000") // Explicitly allow frontend
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials(); // If authentication is used
    });
});

// Add EF Core DbContext with single connection string
var connectionString = $"Host={Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost"};" +
                       $"Port={Environment.GetEnvironmentVariable("DB_PORT") ?? "5432"};" +
                       $"Database={Environment.GetEnvironmentVariable("DB_NAME") ?? "swapstreet_db"};" +
                       $"Username={Environment.GetEnvironmentVariable("DB_USER") ?? "swapstreet_user"};" +
                       $"Password={Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "securepassword123"};";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();

// Add EF Core DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers(); // enable controllers

// Register your ICatalogService implementation
builder.Services.AddScoped<ICatalogService, CatalogService>();

// Allow app to listen on all interfaces (for Docker)
builder.WebHost.UseUrls("http://0.0.0.0:8080/");

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.OpenConnection();
        Console.WriteLine("Database connection successful!");
        db.Database.CloseConnection();
        // db.Database.Migrate(); // Disabled to avoid conflicts
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database connection failed: {ex.Message}");
    }
    var services = scope.ServiceProvider;

    // Migrate the main application database
    var appDb = services.GetRequiredService<AppDbContext>();
    appDb.Database.Migrate();

    // Migrate the auth database
    var authDb = services.GetRequiredService<AuthDbContext>();
    authDb.Database.Migrate();
}

// Enable Swagger
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Backend API V1");
    c.RoutePrefix = string.Empty;
});

app.UseHttpsRedirection();
app.UseCors("AllowFrontend"); // Before MapControllers
app.MapControllers();

app.Run();