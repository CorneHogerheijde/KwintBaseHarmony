using Dapr.Client;
using Dapr.Workflow;
using KwintBaseHarmony.Data;
using KwintBaseHarmony.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add Dapr client
builder.Services.AddDaprClient();

// Add Dapr Workflow
builder.Services.AddDaprWorkflow(options =>
{
    // Register workflows and activities here
    // options.RegisterWorkflow<PuzzleWorkflow>();
});

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

// Add controllers
builder.Services.AddControllers();

// Add CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
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
    
    // Auto-migrate on startup
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<CompositionContext>();
        await dbContext.Database.MigrateAsync();
    }
}

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();
app.UseAuthorization();

// Map Dapr pub/sub endpoints
app.MapSubscribeHandler();

// Map controllers
app.MapControllers();

app.Run();
