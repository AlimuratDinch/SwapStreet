using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
using backend.Data.Seed;
using System.Security.Cryptography;

var builder = WebApplication.CreateBuilder(args);

if (!builder.Environment.IsEnvironment("Test"))
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"), o => o.UseNetTopologySuite()));

    builder.Services.AddDbContext<AuthDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("AuthConnection")));
}

// ===============================================================================
// CONFIGURATION
// ===============================================================================

ConfigureLogging(builder);
ConfigureConfiguration(builder);
ConfigureCors(builder);

// ===============================================================================
// EXTERNAL SERVICES
// ===============================================================================

ConfigureGemini(builder);

ConfigureMinio(builder);

// ===============================================================================
// AUTHENTICATION & AUTHORIZATION
// ===============================================================================

ConfigureAuthentication(builder);

// ===============================================================================
// ASP.NET CORE SERVICES
// ===============================================================================

ConfigureControllers(builder);
ConfigureSwagger(builder);

// ===============================================================================
// APPLICATION SERVICES
// ===============================================================================

RegisterServices(builder);

// ===============================================================================
// BUILD & INITIALIZE
// ===============================================================================

if (!builder.Environment.IsEnvironment("Test"))
{
    ConfigureDatabase(builder);
}

if (!builder.Environment.IsEnvironment("Test"))
{
    builder.WebHost.UseUrls("http://0.0.0.0:8080/");
}

var app = builder.Build();

if (!builder.Environment.IsEnvironment("Test"))
{

    await InitializeMinio(app);


    await InitializeDatabaseAsync(app);
}

// ===============================================================================
// MIDDLEWARE PIPELINE
// ===============================================================================

ConfigureMiddleware(app);

// ===============================================================================
// RUN APPLICATION
// ===============================================================================

await app.RunAsync();

// ===============================================================================
// CONFIGURATION METHODS
// ===============================================================================

static void ConfigureLogging(WebApplicationBuilder builder)
{
    builder.Logging.ClearProviders();
    builder.Logging.AddConsole();
    builder.Logging.SetMinimumLevel(LogLevel.Information);
}

static void ConfigureConfiguration(WebApplicationBuilder builder)
{
    builder.Configuration.AddEnvironmentVariables();

    var frontendUrl = Environment.GetEnvironmentVariable("FrontendUrl") ?? "http://localhost:3000";
    builder.Configuration["FrontendUrl"] = frontendUrl;
}

static void ConfigureCors(WebApplicationBuilder builder)
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.WithOrigins("http://localhost:3000")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    });
}

static void ConfigureGemini(WebApplicationBuilder builder)
{
    var geminiApiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY")
                       ?? GenerateRandomKey(32);
    var geminiApiUrl = Environment.GetEnvironmentVariable("GEMINI_API_URL")
                       ?? "https://generativelanguage.googleapis.com/v1beta/models/";

    builder.Configuration["Gemini:ApiKey"] = geminiApiKey;
    builder.Configuration["Gemini:ApiUrl"] = geminiApiUrl;
}

static void ConfigureDatabase(WebApplicationBuilder builder)
{
    var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
                           ?? "Host=localhost;Port=5432;Database=test_db;Username=postgres;Password=postgres";

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connectionString, o => o.UseNetTopologySuite()));

    builder.Services.AddDbContext<AuthDbContext>(options =>
        options.UseNpgsql(connectionString));
}

static void ConfigureMinio(WebApplicationBuilder builder)
{
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
}

static void ConfigureAuthentication(WebApplicationBuilder builder)
{
    var jwtSecret = builder.Configuration["JWT_SECRET"] ?? GenerateRandomKey(32);
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

    var accessTokenMinutes = int.TryParse(
        builder.Configuration["JWT_ACCESS_TOKEN_EXPIRATION_MINUTES"],
        out var minutes) ? minutes : 60;

    var refreshTokenDays = int.TryParse(
        builder.Configuration["REFRESH_TOKEN_EXPIRATION_DAYS"],
        out var days) ? days : 30;

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key
        };
    });

    builder.Services.AddAuthorization();
}

static void ConfigureControllers(WebApplicationBuilder builder)
{
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
            options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        });
}

static void ConfigureSwagger(WebApplicationBuilder builder)
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
}

static void RegisterServices(WebApplicationBuilder builder)
{
    // Core Services
    builder.Services.AddScoped<IUserService, UserService>();
    builder.Services.AddScoped<ITokenService, TokenService>();
    builder.Services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
    builder.Services.AddScoped<IUserAccountService, UserAccountService>();
    builder.Services.AddScoped<IGenerativeService, GenerativeService>();
    builder.Services.AddScoped<ITryOnService, backend.Services.VirtualTryOn.TryOnService>();
    builder.Services.AddScoped<IFileStorageService, MinioFileStorageService>();
    builder.Services.AddScoped<IProfileService, ProfileService>();
    builder.Services.AddScoped<ILocationService, LocationService>();
    builder.Services.AddScoped<MinioFileStorageService>();
    builder.Services.AddScoped<IFileStorageService>(sp => sp.GetRequiredService<MinioFileStorageService>());
    builder.Services.AddScoped<ImageSeeder>();
    builder.Services.AddScoped<IListingSearchService, ListingSearchService>();
    builder.Services.AddScoped<IListingCommandService, ListingCommandService>();

    // Email Service (environment-dependent)
    if (builder.Environment.IsDevelopment() || builder.Environment.IsEnvironment("Test"))
    {
        builder.Services.AddTransient<IEmailService, MockEmailService>();
    }
    else
    {
        var brevoApiKey = Environment.GetEnvironmentVariable("BREVO_API_KEY");
        var emailSenderName = Environment.GetEnvironmentVariable("EMAIL_SENDER_NAME") ?? "SwapStreet";
        var emailSenderAddress = Environment.GetEnvironmentVariable("EMAIL_SENDER_ADDRESS");

        builder.Configuration["BREVO_API_KEY"] = brevoApiKey;
        builder.Configuration["EMAIL_SENDER_NAME"] = emailSenderName;
        builder.Configuration["EMAIL_SENDER_ADDRESS"] = emailSenderAddress;

        builder.Services.AddTransient<IEmailService, BrevoEmailService>();
    }

    // HTTP Client
    builder.Services.AddHttpClient();

    // TODO: Refactor these services
    // builder.Services.AddScoped<IWishlistService, WishlistService>();
    // builder.Services.AddScoped<ICatalogService, CatalogService>();
}

static async Task InitializeDatabaseAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;

    try
    {
        var env = app.Environment.EnvironmentName;

        var appDb = services.GetRequiredService<AppDbContext>();
        var authDb = services.GetRequiredService<AuthDbContext>();
        var loggerFactory = services.GetRequiredService<ILoggerFactory>();

        // Apply migrations only for relational databases
        if (appDb.Database.IsRelational())
        {
            await appDb.Database.MigrateAsync();
        }

        if (authDb.Database.IsRelational())
        {
            await authDb.Database.MigrateAsync();
        }

        // Seed only in Test or Development environments
        if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Test"))
        {
            await DatabaseSeeder.SeedAsync(
                appDb,
                services,
                loggerFactory.CreateLogger("DatabaseSeeder")
            );
        }

        app.Logger.LogInformation("Database migrations and seeding applied successfully.");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Database initialization failed");
        throw;
    }
}

static async Task InitializeMinio(WebApplication app)
{
    using var scope = app.Services.CreateScope();

    try
    {
        var client = scope.ServiceProvider.GetRequiredService<IMinioClient>();
        var settings = scope.ServiceProvider.GetRequiredService<IOptions<MinioSettings>>().Value;

        var buckets = new[] { settings.PublicBucketName, settings.PrivateBucketName };

        foreach (var bucket in buckets)
        {
            bool exists = await client.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucket));

            if (!exists)
            {
                await client.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucket));

                if (bucket == settings.PublicBucketName)
                {
                    var policyJson = $@"
                    {{
                        ""Version"": ""2012-10-17"",
                        ""Statement"": [
                            {{
                                ""Effect"": ""Allow"",
                                ""Principal"": ""*"",
                                ""Action"": [
                                    ""s3:GetBucketLocation"",
                                    ""s3:ListBucket""
                                ],
                                ""Resource"": [ ""arn:aws:s3:::{bucket}"" ]
                            }},
                            {{
                                ""Effect"": ""Allow"",
                                ""Principal"": ""*"",
                                ""Action"": [ ""s3:GetObject"" ],
                                ""Resource"": [ ""arn:aws:s3:::{bucket}/*"" ]
                            }}
                        ]
                    }}";

                    await client.SetPolicyAsync(new SetPolicyArgs()
                        .WithBucket(bucket)
                        .WithPolicy(policyJson));
                }

                app.Logger.LogInformation("MinIO bucket '{Bucket}' created successfully.", bucket);
            }
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "MinIO initialization failed");
    }
}

static void ConfigureMiddleware(WebApplication app)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Backend API V1");
        c.RoutePrefix = string.Empty;
    });

    // app.UseHttpsRedirection(); // Uncomment for production
    app.UseCors("AllowFrontend");
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();
}

// ===============================================================================
// HELPER METHODS
// ===============================================================================

static string GenerateRandomKey(int length = 32)
{
    var bytes = new byte[length];
    RandomNumberGenerator.Fill(bytes);
    return Convert.ToBase64String(bytes);
}

// Required for integration tests
public partial class Program { }