using Microsoft.EntityFrameworkCore;
using backend.DbContexts;
using backend.Contracts;
using backend.Services;
using backend.Services.Auth;
using backend.Contracts.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using backend.Models;
using Minio;
using Minio.DataModel.Args;
using Microsoft.Extensions.Options;

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
        options
        .UseInMemoryDatabase("AppDb")
        .ConfigureWarnings(x => x.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning)));
    builder.Services.AddDbContext<AuthDbContext>(options =>
        options
        .UseInMemoryDatabase("AuthDb")
        .ConfigureWarnings(x => x.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
        );
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
builder.Services.Configure<MinioSettings>(builder.Configuration.GetSection("Minio"));

// Authentication & Authorization (JWT)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Accept token from Authorization header OR from the access_token cookie
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // If no token found in header, check the access_token cookie (we set this in AuthController)
                if (string.IsNullOrEmpty(context.Token))
                {
                    if (context.Request.Cookies.TryGetValue("access_token", out var tokenFromCookie))
                    {
                        context.Token = tokenFromCookie;
                    }
                }
                return Task.CompletedTask;
            }
        };

        var jwtSecret = builder.Configuration["Jwt:Secret"];
        var key = string.IsNullOrEmpty(jwtSecret) ? Array.Empty<byte>() : Encoding.UTF8.GetBytes(jwtSecret);

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key)
        };
    });

builder.Services.AddAuthorization();

// Register services
builder.Services.AddScoped<ICatalogService, CatalogService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();

builder.WebHost.UseUrls("http://0.0.0.0:8080/");

// Register MinIO client as singleton
builder.Services.AddSingleton<IMinioClient>(sp =>
{
    var settings = sp.GetRequiredService<IOptions<MinioSettings>>().Value;

    return new MinioClient()
        .WithEndpoint(settings.Endpoint)
        .WithCredentials(settings.AccessKey, settings.SecretKey)
        .WithSSL(settings.WithSSL)
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

    bool found = await client.BucketExistsAsync(
        new BucketExistsArgs().WithBucket(settings.BucketName)
    );

    if (!found)
        await client.MakeBucketAsync(new MakeBucketArgs().WithBucket(settings.BucketName));

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
