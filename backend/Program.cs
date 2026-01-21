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
using backend.Hubs;
using backend.Services.Chat;

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
            policy.WithOrigins("http://localhost:3000", "http://localhost:8080") 
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
    var jwtSecret = builder.Configuration["JWT_SECRET"]
                  ?? "402375d38deb9c479fb043f369d1b2d2";

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

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

        // Configure SignalR to use JWT token from query string or header
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                // If the request is for the SignalR hub, get token from query string
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chathub"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
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

    // Add SignalR
    builder.Services.AddSignalR();
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
    builder.Services.AddScoped<IProfileService, ProfileService>();
    builder.Services.AddScoped<ILocationService, LocationService>();
    builder.Services.AddScoped<MinioFileStorageService>();
    builder.Services.AddScoped<IFileStorageService>(sp => sp.GetRequiredService<MinioFileStorageService>());
    builder.Services.AddScoped<ImageSeeder>();
    builder.Services.AddScoped<IListingSearchService, ListingSearchService>();
    builder.Services.AddScoped<IListingCommandService, ListingCommandService>();
    
    // Chat Services
    builder.Services.AddScoped<IChatroomService, ChatroomService>();
    builder.Services.AddScoped<IChatService, ChatService>();

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
}

static async Task InitializeDatabaseAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;

    try
    {
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

    app.UseCors("AllowFrontend");
    app.UseStaticFiles(); // Enable serving static files from wwwroot (e.g., chat-test.html)
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHub<ChatHub>("/chathub");
}

static string GenerateRandomKey(int length)
{
    using var rng = RandomNumberGenerator.Create();
    var bytes = new byte[length];
    rng.GetBytes(bytes);
    return Convert.ToBase64String(bytes);
}

public partial class Program { }
