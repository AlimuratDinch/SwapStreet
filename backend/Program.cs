using Microsoft.EntityFrameworkCore;
using backend.DbContexts;
using backend.Contracts;
using backend.Services;

var builder = WebApplication.CreateBuilder(args);


// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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
    var services = scope.ServiceProvider;

    // Migrate the main application database
    var appDb = services.GetRequiredService<AppDbContext>();
    appDb.Database.Migrate();

    // Migrate the auth database
    var authDb = services.GetRequiredService<AuthDbContext>();
    authDb.Database.Migrate();
}


// Enable Swagger always (for dev/testing)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Backend API V1");
    c.RoutePrefix = string.Empty;
});

app.UseHttpsRedirection();

app.MapControllers();

app.Run();
