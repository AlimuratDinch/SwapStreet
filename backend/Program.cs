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
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using backend.Data.Seed;
using System.Security.Cryptography;

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

// Register services
//builder.Services.AddScoped<ICatalogService, CatalogService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
builder.Services.AddScoped<IFileStorageService, MinioFileStorageService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IUserAccountService, UserAccountService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<ILocationService, LocationService>();
//builder.Services.AddScoped<IWishlistService, WishlistService>();

var jwtSecret = builder.Configuration["JWT_SECRET"]
              ?? "402375d38deb9c479fb043f369d1b2d2";

var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

var accessTokenMinutesString = builder.Configuration["JWT_ACCESS_TOKEN_EXPIRATION_MINUTES"];
var accessTokenMinutes = int.TryParse(accessTokenMinutesString, out var minutes) ? minutes : 60;

var refreshTokenDaysString = builder.Configuration["REFRESH_TOKEN_EXPIRATION_DAYS"];
var refreshTokenDays = int.TryParse(refreshTokenDaysString, out var days) ? days : 30;

// JWT Authentication setup
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
            {
                await client.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucket));

                // If this is the public bucket, make it readable by everyone
                if (bucket == settings.PublicBucketName)
                {
                    var policyJson = @"
                    {
                        ""Version"": ""2012-10-17"",
                        ""Statement"": [
                            {
                                ""Effect"": ""Allow"",
                                ""Principal"": ""*"",
                                ""Action"": [
                                    ""s3:GetBucketLocation"",
                                    ""s3:ListBucket""
                                ],
                                ""Resource"": [ ""arn:aws:s3:::" + bucket + @""" ]
                            },
                            {
                                ""Effect"": ""Allow"",
                                ""Principal"": ""*"",
                                ""Action"": [ ""s3:GetObject"" ],
                                ""Resource"": [ ""arn:aws:s3:::" + bucket + @"/*"" ]
                            }
                        ]
                    }";

                    await client.SetPolicyAsync(new SetPolicyArgs()
                        .WithBucket(bucket)
                        .WithPolicy(policyJson));
                }
            }
        }


        if (!useInMemory)
        {
            appDb.Database.Migrate();
            authDb.Database.Migrate();
            await DatabaseSeeder.SeedAsync(appDb);
            Console.WriteLine("Database migrations applied successfully.");

        }
        else
        {
            Console.WriteLine("Skipping migrations (in-memory mode)");
            Console.WriteLine("Starting Database Seeding...");
            await DatabaseSeeder.SeedAsync(appDb);
            Console.WriteLine("Database Seeding Completed.");
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

//app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

await app.RunAsync();

public partial class Program { }
