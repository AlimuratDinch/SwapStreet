using Microsoft.EntityFrameworkCore;
using backend.DbContexts;
using backend.Contracts;
using backend.Services;
using backend.Services.Auth;
using backend.Contracts.Auth;
using backend.Models;
using Minio;
using Minio.DataModel.Args;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

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
builder.Services.AddScoped<IFileStorageService, MinioFileStorageService>();

// Configure authentication if JWT secret is available
var jwtSecret = builder.Configuration["Jwt:Secret"];
var hasJwtSecret = !string.IsNullOrEmpty(jwtSecret);
if (hasJwtSecret)
{
    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        var key = Encoding.UTF8.GetBytes(jwtSecret!);
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = false // Allow expired tokens for testing
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Request.Cookies["access_token"];
                if (!string.IsNullOrEmpty(token))
                {
                    context.Token = token;
                }
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                context.NoResult();
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                context.HandleResponse();
                return Task.CompletedTask;
            }
        };
    });

    builder.Services.AddAuthorization(options =>
    {
        options.FallbackPolicy = null;
    });
}

builder.WebHost.UseUrls("http://0.0.0.0:8080/");


// Register MinIO client
builder.Services.AddSingleton<IMinioClient>(sp =>
{
    var endpoint = Environment.GetEnvironmentVariable("MINIO_ENDPOINT") ?? "minio:9000";
    var accessKey = Environment.GetEnvironmentVariable("MINIO_ACCESS_KEY") ?? "minioadmin";
    var secretKey = Environment.GetEnvironmentVariable("MINIO_SECRET_KEY") ?? "minioadmin";
    var useSsl = bool.TryParse(Environment.GetEnvironmentVariable("MINIO_USE_SSL"), out var ssl) && ssl;

    return new MinioClient()
        .WithEndpoint(endpoint)
        .WithCredentials(accessKey, secretKey)
        .WithSSL(useSsl)
        .Build();
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    try
    {
        var appDb = services.GetRequiredService<AppDbContext>();
        var authDb = services.GetRequiredService<AuthDbContext>();

        var client = scope.ServiceProvider.GetRequiredService<IMinioClient>();
        var settings = scope.ServiceProvider.GetRequiredService<IOptions<MinioSettings>>().Value;

        var buckets = new[] { settings.PublicBucketName, settings.PrivateBucketName };

        foreach (var bucket in buckets)
        {
            bool exists = await client.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucket));
            if (!exists)
                await client.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucket));
        }

        if (!useInMemory)
        {
            appDb.Database.Migrate();
            authDb.Database.Migrate();
            Console.WriteLine("Database migrations applied successfully.");
            
            // Seed initial categories if database is empty
            if (!appDb.Categories.Any())
            {
                Console.WriteLine("Seeding initial categories...");
                var categories = new[]
                {
                    new Category { Name = "Tops" },
                    new Category { Name = "Bottoms" },
                    new Category { Name = "Accessories" },
                    new Category { Name = "Portables" },
                    new Category { Name = "Sale" }
                };
                appDb.Categories.AddRange(categories);
                appDb.SaveChanges();
                Console.WriteLine("Categories seeded successfully.");
            }
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

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Backend API V1");
    c.RoutePrefix = string.Empty;
});

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

if (hasJwtSecret)
{
    app.UseAuthentication();
    app.UseAuthorization();
}
app.MapControllers();

await app.RunAsync();

public partial class Program { }
