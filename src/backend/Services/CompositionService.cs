using System.Text.Json;
using KwintBaseHarmony.Data;
using KwintBaseHarmony.Models;
using Microsoft.EntityFrameworkCore;

namespace KwintBaseHarmony.Services;

public class CompositionService : ICompositionService
{
    private readonly CompositionContext _context;
    private readonly ILogger<CompositionService> _logger;

    public CompositionService(CompositionContext context, ILogger<CompositionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new composition with empty 7 layers (Kwintessence structure).
    /// </summary>
    public async Task<Composition> CreateAsync(string studentId, string title, string difficulty, string style = "classical")
    {
        var composition = new Composition
        {
            StudentId = studentId,
            Title = title,
            Difficulty = difficulty.Trim(),
            Style = style.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        composition.ValidateMetadata();

        // Initialize 7 empty layers
        for (int i = 1; i <= 7; i++)
        {
            composition.Layers.Add(new Layer
            {
                CompositionId = composition.Id,
                LayerNumber = i,
                Name = GetDefaultLayerName(i),
                Concept = GetDefaultLayerConcept(i),
                Completed = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        _context.Compositions.Add(composition);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Created composition {CompositionId} for student {StudentId}",
            composition.Id, studentId);

        return composition;
    }

    /// <summary>
    /// Retrieves a composition by ID with all layers and notes.
    /// </summary>
    public async Task<Composition?> GetByIdAsync(Guid compositionId)
    {
        return await _context.Compositions
            .Include(c => c.Layers.OrderBy(l => l.LayerNumber))
            .ThenInclude(l => l.Notes.OrderBy(n => n.TimingMs))
            .FirstOrDefaultAsync(c => c.Id == compositionId);
    }

    /// <summary>
    /// Retrieves all compositions for a student, ordered by creation date (newest first).
    /// </summary>
    public async Task<List<Composition>> GetByStudentIdAsync(string studentId)
    {
        return await _context.Compositions
            .Where(c => c.StudentId == studentId)
            .Include(c => c.Layers)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Updates a composition (timestamps, metadata, etc.).
    /// Does not recalculate completion—use UpdateCompletionPercentage() separately.
    /// </summary>
    public async Task<Composition> UpdateAsync(Composition composition)
    {
        composition.ValidateMetadata();
        composition.UpdatedAt = DateTime.UtcNow;
        _context.Compositions.Update(composition);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Updated composition {CompositionId}",
            composition.Id);

        return composition;
    }

    /// <summary>
    /// Deletes a composition and all associated layers and notes (cascade delete via EF).
    /// </summary>
    public async Task<bool> DeleteAsync(Guid compositionId)
    {
        var composition = await GetByIdAsync(compositionId);
        if (composition == null)
            return false;

        _context.Compositions.Remove(composition);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted composition {CompositionId}", compositionId);
        return true;
    }

    /// <summary>
    /// Adds a note to a specific layer. Updates the updatedAt timestamp.
    /// </summary>
    public async Task<Composition> AddNoteToLayerAsync(Guid compositionId, int layerNumber, Note note)
    {
        var composition = await GetByIdAsync(compositionId)
            ?? throw new KeyNotFoundException($"Composition {compositionId} not found");

        var layer = composition.Layers.FirstOrDefault(l => l.LayerNumber == layerNumber)
            ?? throw new InvalidOperationException(
                $"Layer {layerNumber} not found in composition {compositionId}");

        note.LayerId = layer.Id;
        note.CreatedAt = DateTime.UtcNow;
        layer.Notes.Add(note);
        _context.Notes.Add(note);
        layer.UpdatedAt = DateTime.UtcNow;
        composition.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Added note (pitch {Pitch}) to layer {LayerNumber} in composition {CompositionId}",
            note.Pitch, layerNumber, compositionId);

        return composition;
    }

    /// <summary>
    /// Marks a layer as completed and updates completion percentage.
    /// Optionally records puzzle analytics: attempt count, first-try correctness, and time spent.
    /// </summary>
    public async Task<Composition> CompleteLayerAsync(
        Guid compositionId,
        int layerNumber,
        int? attempts,
        bool? firstTryCorrect,
        long? timeSpentMs)
    {
        var composition = await GetByIdAsync(compositionId)
            ?? throw new KeyNotFoundException($"Composition {compositionId} not found");

        var layer = composition.Layers.FirstOrDefault(l => l.LayerNumber == layerNumber)
            ?? throw new InvalidOperationException(
                $"Layer {layerNumber} not found in composition {compositionId}");

        layer.Completed = true;
        layer.TimeSpentMs = timeSpentMs ?? 0;
        layer.PuzzleAnswersJson = (attempts.HasValue || firstTryCorrect.HasValue)
            ? System.Text.Json.JsonSerializer.Serialize(new
                {
                    attempts = attempts ?? 1,
                    firstTryCorrect = firstTryCorrect ?? false
                })
            : null;
        layer.UpdatedAt = DateTime.UtcNow;
        composition.UpdatedAt = DateTime.UtcNow;
        composition.UpdateCompletionPercentage();

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Completed layer {LayerNumber} in composition {CompositionId}. Completion: {Percent}%",
            layerNumber, compositionId, composition.CompletionPercentage);

        return composition;
    }

    /// <summary>
    /// Validates composition structure (5-7 layers) and saves.
    /// Throws InvalidOperationException if validation fails.
    /// </summary>
    public async Task<Composition> ValidateAndSaveAsync(Composition composition)
    {
        composition.ValidateMetadata();
        composition.ValidateLayers();
        composition.UpdateCompletionPercentage();
        composition.UpdatedAt = DateTime.UtcNow;

        var existingComposition = await _context.Compositions
            .Include(existing => existing.Layers)
            .ThenInclude(layer => layer.Notes)
            .FirstOrDefaultAsync(existing => existing.Id == composition.Id);

        if (existingComposition is not null)
        {
            _context.Compositions.Remove(existingComposition);
            await _context.SaveChangesAsync();
        }

        _context.Compositions.Add(composition);

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Validated and saved composition {CompositionId}",
            composition.Id);

        return composition;
    }

    /// <summary>
    /// Serializes a composition to JSON with all layers and notes.
    /// </summary>
    public string SerializeToJson(Composition composition)
    {
        var exportModel = new CompositionExportModel(
            composition.Id,
            composition.StudentId,
            composition.Title,
            composition.Difficulty,
            composition.Style,
            composition.CompletionPercentage,
            composition.CreatedAt,
            composition.UpdatedAt,
            composition.Layers
                .OrderBy(layer => layer.LayerNumber)
                .Select(layer => new LayerExportModel(
                    layer.Id,
                    layer.CompositionId,
                    layer.LayerNumber,
                    layer.Name,
                    layer.Concept,
                    layer.Completed,
                    layer.TimeSpentMs,
                    layer.UserNotes,
                    layer.PuzzleAnswersJson,
                    layer.CreatedAt,
                    layer.UpdatedAt,
                    layer.Notes
                        .OrderBy(note => note.TimingMs)
                        .Select(note => new NoteExportModel(
                            note.Id,
                            note.LayerId,
                            note.Pitch,
                            note.DurationMs,
                            note.TimingMs,
                            note.Velocity,
                            note.CreatedAt))
                        .ToList()))
                .ToList());

        var json = JsonSerializer.Serialize(exportModel, new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNameCaseInsensitive = false,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        _logger.LogDebug("Serialized composition {CompositionId} to JSON", composition.Id);
        return json;
    }

    /// <summary>
    /// Deserializes a composition from JSON string.
    /// Validates structure and restores entity relationships.
    /// </summary>
    public Composition DeserializeFromJson(string json)
    {
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        var exportModel = JsonSerializer.Deserialize<CompositionExportModel>(json, options)
            ?? throw new InvalidOperationException("Failed to deserialize JSON to Composition");

        var composition = new Composition
        {
            Id = exportModel.Id,
            StudentId = exportModel.StudentId,
            Title = exportModel.Title,
            Difficulty = exportModel.Difficulty.Trim(),
            Style = exportModel.Style.Trim(),
            CompletionPercentage = exportModel.CompletionPercentage,
            CreatedAt = exportModel.CreatedAt,
            UpdatedAt = exportModel.UpdatedAt,
            Layers = exportModel.Layers
                .Select(layerModel =>
                {
                    var layer = new Layer
                    {
                        Id = layerModel.Id,
                        CompositionId = exportModel.Id,
                        LayerNumber = layerModel.LayerNumber,
                        Name = layerModel.Name,
                        Concept = layerModel.Concept,
                        Completed = layerModel.Completed,
                        TimeSpentMs = layerModel.TimeSpentMs,
                        UserNotes = layerModel.UserNotes,
                        PuzzleAnswersJson = layerModel.PuzzleAnswersJson,
                        CreatedAt = layerModel.CreatedAt,
                        UpdatedAt = layerModel.UpdatedAt
                    };

                    layer.Notes = layerModel.Notes
                        .Select(noteModel => new Note
                        {
                            Id = noteModel.Id,
                            LayerId = layer.Id,
                            Pitch = noteModel.Pitch,
                            DurationMs = noteModel.DurationMs,
                            TimingMs = noteModel.TimingMs,
                            Velocity = noteModel.Velocity,
                            CreatedAt = noteModel.CreatedAt
                        })
                        .ToList();

                    return layer;
                })
                .ToList()
        };

        // Validate structure
        composition.ValidateMetadata();
        composition.ValidateLayers();

        _logger.LogDebug("Deserialized composition {CompositionId} from JSON", composition.Id);
        return composition;
    }

    /// <summary>
    /// Creates the next movement in a composition chain.
    /// Movement 2 or 3 is created from a movement-1 (or movement-2) root composition.
    /// Inherits studentId, rootMidi, difficulty, and title (with suffix appended).
    /// </summary>
    public async Task<Composition> CreateNextMovementAsync(Guid parentCompositionId)
    {
        var parent = await GetByIdAsync(parentCompositionId)
            ?? throw new KeyNotFoundException($"Composition {parentCompositionId} not found");

        // Resolve to the movement-1 root so we always link movements 2 and 3 to the same parent.
        var root = parent.MovementNumber == 1
            ? parent
            : await GetByIdAsync(parent.ParentCompositionId!.Value)
                ?? throw new KeyNotFoundException($"Root composition not found");

        if (root.CompletionPercentage < 100)
            throw new InvalidOperationException("Movement 1 must be fully complete before creating a next movement.");

        // Find current highest movement in the chain.
        var chain = await GetMovementChainAsync(root.Id);
        var maxMovement = chain.Max(c => c.MovementNumber);

        if (maxMovement >= 3)
            throw new InvalidOperationException("A composition chain cannot have more than 3 movements.");

        // Verify the latest movement is complete before allowing the next.
        var latest = chain.First(c => c.MovementNumber == maxMovement);
        if (latest.CompletionPercentage < 100)
            throw new InvalidOperationException($"Movement {maxMovement} must be fully complete before creating movement {maxMovement + 1}.");

        var suffix = maxMovement + 1 == 2 ? " \u2014 II" : " \u2014 III";
        var title = root.Title.EndsWith(" \u2014 II") ? root.Title[..^4] : root.Title;
        title = title.EndsWith(" \u2014 III") ? title[..^5] : title;

        var next = new Composition
        {
            StudentId = root.StudentId,
            Title = title + suffix,
            Difficulty = root.Difficulty,
            Style = root.Style,
            RootMidi = root.RootMidi,
            MovementNumber = maxMovement + 1,
            ParentCompositionId = root.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        for (int i = 1; i <= 7; i++)
        {
            next.Layers.Add(new Layer
            {
                CompositionId = next.Id,
                LayerNumber = i,
                Name = GetDefaultLayerName(i),
                Concept = GetDefaultLayerConcept(i),
                Completed = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        _context.Compositions.Add(next);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Created movement {MovementNumber} composition {CompositionId} for student {StudentId}",
            next.MovementNumber, next.Id, next.StudentId);

        return next;
    }

    /// <summary>
    /// Returns all compositions in the movement chain identified by any member composition.
    /// The chain is identified by the movement-1 root.
    /// </summary>
    public async Task<List<Composition>> GetMovementChainAsync(Guid compositionId)
    {
        var seed = await _context.Compositions
            .FirstOrDefaultAsync(c => c.Id == compositionId)
            ?? throw new KeyNotFoundException($"Composition {compositionId} not found");

        var rootId = seed.MovementNumber == 1 ? seed.Id : seed.ParentCompositionId!.Value;

        return await _context.Compositions
            .Include(c => c.Layers)
            .Where(c => c.Id == rootId || c.ParentCompositionId == rootId)
            .OrderBy(c => c.MovementNumber)
            .ToListAsync();
    }

    private static string GetDefaultLayerName(int layerNumber) => layerNumber switch
    {
        1 => "Foundation",
        2 => "The Fifth",
        3 => "The Third",
        4 => "The Seventh",
        5 => "The Secunde",
        6 => "The Sixth",
        7 => "Resolution",
        _ => $"Layer {layerNumber}"
    };

    private static string GetDefaultLayerConcept(int layerNumber) => layerNumber switch
    {
        1 => "Play the root note — C. This is the anchor of your entire harmony.",
        2 => "Add the perfect fifth — G. It creates openness and stability above the root.",
        3 => "Complete the triad by adding the third — E. This gives the chord its bright character.",
        4 => "Add the major seventh — B. It brings sophistication and luminous tension.",
        5 => "Add the secunde — D. The second degree, extending the harmony into a new voice.",
        6 => "Add the major sixth — A. It brings warmth and a sense of longing.",
        7 => "Return to the root — C, one octave higher. Anchor the harmony and complete your composition.",
        _ => $"Layer {layerNumber} concept"
    };

    private sealed record CompositionExportModel(
        Guid Id,
        string StudentId,
        string Title,
        string Difficulty,
        string Style,
        decimal CompletionPercentage,
        DateTime CreatedAt,
        DateTime UpdatedAt,
        List<LayerExportModel> Layers);

    private sealed record LayerExportModel(
        Guid Id,
        Guid CompositionId,
        int LayerNumber,
        string Name,
        string? Concept,
        bool Completed,
        long TimeSpentMs,
        string? UserNotes,
        string? PuzzleAnswersJson,
        DateTime CreatedAt,
        DateTime UpdatedAt,
        List<NoteExportModel> Notes);

    private sealed record NoteExportModel(
        Guid Id,
        Guid LayerId,
        int Pitch,
        int DurationMs,
        int TimingMs,
        int Velocity,
        DateTime CreatedAt);
}
