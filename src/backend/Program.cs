using System.Text;
using Dapr.Client;
using KwintBaseHarmony.Api;
using KwintBaseHarmony.Auth;
using KwintBaseHarmony.Data;
using KwintBaseHarmony.Infrastructure;
using KwintBaseHarmony.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add Dapr client
builder.Services.AddDaprClient();

// Add PostgreSQL DbContext
builder.Services.AddDbContext<CompositionContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Host=localhost;Port=5432;Database=kwintbaseharmony;Username=postgres;Password=postgres";
    options.UseNpgsql(connectionString);
});

// Register application services
builder.Services.AddScoped<ICompositionService, CompositionService>();
builder.Services.AddScoped<IMidiExportService, MidiExportService>();

// Add JWT authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "test-only-secret-key-not-for-production!!!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();


// Add CORS for frontend
// Additional origins can be added via configuration (e.g. Cors__AllowedOrigins__0=https://...)
var defaultOrigins = new[] { "http://localhost:5051", "http://127.0.0.1:5051", "http://localhost:5173", "http://localhost:3000" };
var configuredOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
var allowedOrigins = defaultOrigins.Union(configuredOrigins).ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Run database migrations on startup (idempotent).
// Skipped in "Testing" environment where an in-memory DB is used (migrations are not supported).
if (!app.Environment.IsEnvironment("Testing"))
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<CompositionContext>();
    await dbContext.Database.MigrateAsync();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
if (!app.Environment.IsEnvironment("Testing")
    && HttpsRedirectionPolicy.ShouldUseHttpsRedirection(app.Configuration))
{
    app.UseHttpsRedirection();
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// Map Dapr pub/sub endpoints
app.MapSubscribeHandler();

// Map API endpoint groups
app
    .MapAuthEndpoints()
    .MapCompositionEndpoints()
    .MapLayerEndpoints()
    .MapAnalyticsEndpoints()
    .MapExportEndpoints()
    .MapMovementEndpoints();

app.Run();

// Required for xUnit WebApplicationFactory<Program> in integration tests
public partial class Program;
