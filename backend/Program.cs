var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Allow app to listen on all interfaces (for Docker)
builder.WebHost.UseUrls("http://0.0.0.0:8080/");

var app = builder.Build();

// Enable Swagger always (for dev/testing)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Backend API V1");
    c.RoutePrefix = string.Empty; // Swagger available at http://localhost:8080/
});

app.UseHttpsRedirection();

app.Run();
