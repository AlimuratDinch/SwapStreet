using Microsoft.EntityFrameworkCore;
using backend.DbContexts;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add EF Core DbContext (use in-memory or PostgreSQL/SQL Server/etc.)
builder.Services.AddDbContext<CatalogDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers(); // 👈 enable controllers

// Allow app to listen on all interfaces (for Docker)
builder.WebHost.UseUrls("http://0.0.0.0:8080/");

var app = builder.Build();

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
