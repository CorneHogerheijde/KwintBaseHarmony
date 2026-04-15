using Dapr.Client;
// using Dapr.Workflow; // Uncomment when workflow orchestration is needed (Phase 2+)
using KwintBaseHarmony.Data;
using KwintBaseHarmony.Infrastructure;
using KwintBaseHarmony.Services;
using KwintBaseHarmony.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add Dapr client
builder.Services.AddDaprClient();

// Add Dapr Workflow — uncomment when workflow orchestration is needed (Phase 2+).
// Disabled for now: AddDaprWorkflow registers a hosted service that connects to the
// Dapr actor placement service via gRPC on startup, which fails in environments
// where the placement service is not running (e.g. local Dapr CLI without actors).
// builder.Services.AddDaprWorkflow(options =>
// {
//     options.RegisterWorkflow<PuzzleWorkflow>();
// });

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


// Add CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5051", "http://127.0.0.1:5051", "http://localhost:5173", "http://localhost:3000")
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
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<CompositionContext>();
    await dbContext.Database.MigrateAsync();
}

app.UseCors("AllowFrontend");
if (!app.Environment.IsEnvironment("Testing")
    && HttpsRedirectionPolicy.ShouldUseHttpsRedirection(app.Configuration))
{
    app.UseHttpsRedirection();
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// Map Dapr pub/sub endpoints
app.MapSubscribeHandler();

var compositions = app.MapGroup("/api/compositions");

compositions.MapPost("", async (
    CreateCompositionRequest request,
    ICompositionService compositionService,
    ILogger<Program> logger) =>
{
    if (string.IsNullOrWhiteSpace(request.StudentId))
    {
        return Results.BadRequest(new { error = "StudentId is required" });
    }

    if (string.IsNullOrWhiteSpace(request.Title))
    {
        return Results.BadRequest(new { error = "Title is required" });
    }

    Composition composition;

    try
    {
        composition = await compositionService.CreateAsync(
            request.StudentId,
            request.Title,
            request.Difficulty ?? "beginner");
    }
    catch (InvalidOperationException exception)
    {
        return Results.UnprocessableEntity(new { error = exception.Message });
    }

    logger.LogInformation(
        "Created composition {CompositionId} for student {StudentId}",
        composition.Id,
        request.StudentId);

    return Results.Created($"/api/compositions/{composition.Id}", MapToResponse(composition));
});

compositions.MapGet("/{id:guid}", async (Guid id, ICompositionService compositionService) =>
{
    var composition = await compositionService.GetByIdAsync(id);
    return composition is null
        ? Results.NotFound(new { error = $"Composition {id} not found" })
        : Results.Ok(MapToResponse(composition));
});

compositions.MapGet("/student/{studentId}", async (string studentId, ICompositionService compositionService) =>
{
    var results = await compositionService.GetByStudentIdAsync(studentId);
    return Results.Ok(results.Select(MapToResponse).ToList());
});

compositions.MapPut("/{id:guid}", async (
    Guid id,
    UpdateCompositionRequest request,
    ICompositionService compositionService,
    ILogger<Program> logger) =>
{
    var composition = await compositionService.GetByIdAsync(id);
    if (composition is null)
    {
        return Results.NotFound(new { error = $"Composition {id} not found" });
    }

    if (!string.IsNullOrWhiteSpace(request.Title))
    {
        composition.Title = request.Title;
    }

    if (!string.IsNullOrWhiteSpace(request.Difficulty))
    {
        composition.Difficulty = request.Difficulty;
    }

    Composition updated;

    try
    {
        updated = await compositionService.UpdateAsync(composition);
    }
    catch (InvalidOperationException exception)
    {
        return Results.BadRequest(new { error = exception.Message });
    }

    logger.LogInformation("Updated composition {CompositionId}", id);

    return Results.Ok(MapToResponse(updated));
});

compositions.MapDelete("/{id:guid}", async (Guid id, ICompositionService compositionService, ILogger<Program> logger) =>
{
    var deleted = await compositionService.DeleteAsync(id);
    if (!deleted)
    {
        return Results.NotFound(new { error = $"Composition {id} not found" });
    }

    logger.LogInformation("Deleted composition {CompositionId}", id);
    return Results.NoContent();
});

compositions.MapPost("/{id:guid}/layers/{layerNumber:int}/notes", async (
    Guid id,
    int layerNumber,
    AddNoteRequest request,
    ICompositionService compositionService,
    ILogger<Program> logger) =>
{
    if (layerNumber < 1 || layerNumber > 7)
    {
        return Results.BadRequest(new { error = "Layer number must be between 1 and 7" });
    }

    if (request.Pitch < 0 || request.Pitch > 127)
    {
        return Results.BadRequest(new { error = "Pitch must be between 0 and 127 (MIDI)" });
    }

    if (request.DurationMs <= 0)
    {
        return Results.BadRequest(new { error = "Duration must be greater than 0" });
    }

    try
    {
        var note = new Note
        {
            Pitch = request.Pitch,
            DurationMs = request.DurationMs,
            TimingMs = request.TimingMs,
            Velocity = Math.Clamp(request.Velocity ?? 100, 0, 127)
        };

        var composition = await compositionService.AddNoteToLayerAsync(id, layerNumber, note);
        logger.LogInformation(
            "Added note to composition {CompositionId} layer {LayerNumber}",
            id,
            layerNumber);

        return Results.Created($"/api/compositions/{id}", MapToResponse(composition));
    }
    catch (Exception exception) when (exception is KeyNotFoundException or InvalidOperationException)
    {
        return Results.NotFound(new { error = exception.Message });
    }
});

compositions.MapPost("/{id:guid}/layers/{layerNumber:int}/complete", async (
    Guid id,
    int layerNumber,
    ICompositionService compositionService,
    ILogger<Program> logger) =>
{
    if (layerNumber < 1 || layerNumber > 7)
    {
        return Results.BadRequest(new { error = "Layer number must be between 1 and 7" });
    }

    try
    {
        var composition = await compositionService.CompleteLayerAsync(id, layerNumber);
        logger.LogInformation("Completed layer {LayerNumber} in composition {CompositionId}", layerNumber, id);
        return Results.Ok(MapToResponse(composition));
    }
    catch (Exception exception) when (exception is KeyNotFoundException or InvalidOperationException)
    {
        return Results.NotFound(new { error = exception.Message });
    }
});

compositions.MapGet("/{id:guid}/export/midi", async (
    Guid id,
    ICompositionService compositionService,
    IMidiExportService midiExportService,
    ILogger<Program> logger) =>
{
    var composition = await compositionService.GetByIdAsync(id);
    if (composition is null)
    {
        return Results.NotFound(new { error = $"Composition {id} not found" });
    }

    var midiData = await midiExportService.CompositionToMidiAsync(composition);
    logger.LogInformation("Exported composition {CompositionId} to MIDI ({Bytes} bytes)", id, midiData.Length);
    return Results.File(midiData, "audio/midi", $"composition-{id}.mid");
});

compositions.MapGet("/{id:guid}/export/json", async (Guid id, ICompositionService compositionService, ILogger<Program> logger) =>
{
    var composition = await compositionService.GetByIdAsync(id);
    if (composition is null)
    {
        return Results.NotFound(new { error = $"Composition {id} not found" });
    }

    logger.LogInformation("Exported composition {CompositionId} to JSON", id);
    return Results.Ok(compositionService.SerializeToJson(composition));
});

compositions.MapPost("/import/json", async (
    ImportJsonRequest request,
    ICompositionService compositionService,
    ILogger<Program> logger) =>
{
    try
    {
        var composition = compositionService.DeserializeFromJson(request.Json);
        var saved = await compositionService.ValidateAndSaveAsync(composition);
        logger.LogInformation("Imported composition {CompositionId} from JSON", saved.Id);
        return Results.Created($"/api/compositions/{saved.Id}", MapToResponse(saved));
    }
    catch (Exception exception)
    {
        logger.LogError(exception, "Failed to import composition from JSON");
        return Results.BadRequest(new { error = "Invalid JSON format or content", details = exception.Message });
    }
});

app.Run();

static CompositionResponse MapToResponse(Composition composition)
{
    return new CompositionResponse(
        composition.Id,
        composition.StudentId,
        composition.Title,
        composition.Difficulty,
        composition.CompletionPercentage,
        composition.CreatedAt,
        composition.UpdatedAt,
        composition.Layers
            .OrderBy(layer => layer.LayerNumber)
            .Select(layer => new LayerResponse(
                layer.LayerNumber,
                layer.Name,
                layer.Concept,
                layer.Completed,
                layer.TimeSpentMs,
                layer.UserNotes,
                layer.Notes
                    .OrderBy(note => note.TimingMs)
                    .Select(note => new NoteResponse(
                        note.Pitch,
                        note.DurationMs,
                        note.TimingMs,
                        note.Velocity,
                        note.CreatedAt))
                    .ToList()))
            .ToList());
}

public sealed record CreateCompositionRequest(string StudentId, string Title, string? Difficulty);

public sealed record UpdateCompositionRequest(string? Title, string? Difficulty);

public sealed record AddNoteRequest(int Pitch, int DurationMs, int TimingMs, int? Velocity);

public sealed record ImportJsonRequest(string Json);

public sealed record CompositionResponse(
    Guid Id,
    string StudentId,
    string Title,
    string Difficulty,
    decimal CompletionPercentage,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<LayerResponse> Layers);

public sealed record LayerResponse(
    int LayerNumber,
    string Name,
    string? Concept,
    bool Completed,
    long TimeSpentMs,
    string? UserNotes,
    List<NoteResponse> Notes);

public sealed record NoteResponse(
    int Pitch,
    int DurationMs,
    int TimingMs,
    int Velocity,
    DateTime CreatedAt);

public partial class Program;
