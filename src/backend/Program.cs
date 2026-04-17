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
    CompleteLayerRequest? body,
    ICompositionService compositionService,
    ILogger<Program> logger) =>
{
    if (layerNumber < 1 || layerNumber > 7)
    {
        return Results.BadRequest(new { error = "Layer number must be between 1 and 7" });
    }

    if (body?.Attempts is < 1)
    {
        return Results.BadRequest(new { error = "attempts must be >= 1" });
    }

    if (body?.TimeSpentMs is < 0)
    {
        return Results.BadRequest(new { error = "timeSpentMs must be >= 0" });
    }

    try
    {
        var composition = await compositionService.CompleteLayerAsync(
            id, layerNumber, body?.Attempts, body?.FirstTryCorrect, body?.TimeSpentMs);
        logger.LogInformation("Completed layer {LayerNumber} in composition {CompositionId}", layerNumber, id);
        return Results.Ok(MapToResponse(composition));
    }
    catch (Exception exception) when (exception is KeyNotFoundException or InvalidOperationException)
    {
        return Results.NotFound(new { error = exception.Message });
    }
});

compositions.MapGet("/{id:guid}/analytics", async (Guid id, ICompositionService compositionService) =>
{
    var composition = await compositionService.GetByIdAsync(id);
    if (composition is null)
    {
        return Results.NotFound(new { error = $"Composition {id} not found" });
    }

    var layerAnalytics = composition.Layers
        .OrderBy(l => l.LayerNumber)
        .Select(l =>
        {
            int? attempts = null;
            bool? firstTryCorrect = null;

            if (l.PuzzleAnswersJson is not null)
            {
                try
                {
                    var doc = System.Text.Json.JsonDocument.Parse(l.PuzzleAnswersJson);
                    if (doc.RootElement.TryGetProperty("attempts", out var attemptsEl))
                        attempts = attemptsEl.GetInt32();
                    if (doc.RootElement.TryGetProperty("firstTryCorrect", out var ftcEl))
                        firstTryCorrect = ftcEl.GetBoolean();
                }
                catch (System.Text.Json.JsonException) { /* malformed data — skip */ }
            }

            return new LayerAnalyticsResponse(l.LayerNumber, l.Name, l.Completed, l.TimeSpentMs, attempts, firstTryCorrect);
        })
        .ToList();

    int completedLayers = layerAnalytics.Count(la => la.Completed);
    long totalTimeSpentMs = layerAnalytics.Sum(la => la.TimeSpentMs);

    var layersWithAttempts = layerAnalytics.Where(la => la.Attempts.HasValue).ToList();
    double? averageAttemptsPerLayer = layersWithAttempts.Count > 0
        ? Math.Round((double)layersWithAttempts.Sum(la => la.Attempts!.Value) / layersWithAttempts.Count, 2)
        : null;

    var layersWithFtc = layerAnalytics.Where(la => la.FirstTryCorrect.HasValue).ToList();
    double? firstTryCorrectRate = layersWithFtc.Count > 0
        ? Math.Round((double)layersWithFtc.Count(la => la.FirstTryCorrect!.Value) / layersWithFtc.Count, 4)
        : null;

    var summary = new AnalyticsSummaryResponse(
        completedLayers,
        layerAnalytics.Count,
        totalTimeSpentMs,
        averageAttemptsPerLayer,
        firstTryCorrectRate);

    return Results.Ok(new CompositionAnalyticsResponse(
        composition.Id,
        composition.Difficulty,
        composition.CompletionPercentage,
        summary,
        layerAnalytics));
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

compositions.MapPost("/{id:guid}/movements", async (
    Guid id,
    ICompositionService compositionService,
    ILogger<Program> logger) =>
{
    try
    {
        var next = await compositionService.CreateNextMovementAsync(id);
        logger.LogInformation(
            "Created movement {MovementNumber} composition {CompositionId}",
            next.MovementNumber, next.Id);
        return Results.Created($"/api/compositions/{next.Id}", MapToResponse(next));
    }
    catch (KeyNotFoundException exception)
    {
        return Results.NotFound(new { error = exception.Message });
    }
    catch (InvalidOperationException exception)
    {
        return Results.Conflict(new { error = exception.Message });
    }
});

compositions.MapGet("/{id:guid}/movements", async (
    Guid id,
    ICompositionService compositionService) =>
{
    try
    {
        var chain = await compositionService.GetMovementChainAsync(id);
        return Results.Ok(chain.Select(MapToResponse).ToList());
    }
    catch (KeyNotFoundException exception)
    {
        return Results.NotFound(new { error = exception.Message });
    }
});

compositions.MapPatch("/{id:guid}/root-midi", async (
    Guid id,
    UpdateRootMidiRequest request,
    ICompositionService compositionService,
    ILogger<Program> logger) =>
{
    if (request.RootMidi < 0 || request.RootMidi > 127)
    {
        return Results.BadRequest(new { error = "RootMidi must be between 0 and 127" });
    }

    var composition = await compositionService.GetByIdAsync(id);
    if (composition is null)
    {
        return Results.NotFound(new { error = $"Composition {id} not found" });
    }

    composition.RootMidi = request.RootMidi;
    var updated = await compositionService.UpdateAsync(composition);

    logger.LogInformation("Updated root MIDI to {RootMidi} for composition {CompositionId}", request.RootMidi, id);
    return Results.Ok(MapToResponse(updated));
});

// ── Apply pending EF Core migrations on startup ───────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CompositionContext>();
    await db.Database.MigrateAsync();
}

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
        composition.RootMidi,
        composition.MovementNumber,
        composition.ParentCompositionId,
        composition.Layers
            .OrderBy(layer => layer.LayerNumber)
            .Select(layer => new LayerResponse(
                layer.LayerNumber,
                layer.Name,
                layer.Concept,
                layer.Completed,
                layer.TimeSpentMs,
                layer.UserNotes,
                layer.PuzzleAnswersJson,
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

public sealed record UpdateRootMidiRequest(int RootMidi);

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
    int RootMidi,
    int MovementNumber,
    Guid? ParentCompositionId,
    List<LayerResponse> Layers);

public sealed record CompleteLayerRequest(int? Attempts, bool? FirstTryCorrect, long? TimeSpentMs);

public sealed record LayerResponse(
    int LayerNumber,
    string Name,
    string? Concept,
    bool Completed,
    long TimeSpentMs,
    string? UserNotes,
    string? PuzzleAnswersJson,
    List<NoteResponse> Notes);

public sealed record NoteResponse(
    int Pitch,
    int DurationMs,
    int TimingMs,
    int Velocity,
    DateTime CreatedAt);

public sealed record LayerAnalyticsResponse(
    int LayerNumber,
    string Name,
    bool Completed,
    long TimeSpentMs,
    int? Attempts,
    bool? FirstTryCorrect);

public sealed record AnalyticsSummaryResponse(
    int CompletedLayers,
    int TotalLayers,
    long TotalTimeSpentMs,
    double? AverageAttemptsPerLayer,
    double? FirstTryCorrectRate);

public sealed record CompositionAnalyticsResponse(
    Guid CompositionId,
    string Difficulty,
    decimal CompletionPercentage,
    AnalyticsSummaryResponse Summary,
    List<LayerAnalyticsResponse> Layers);

public partial class Program;
