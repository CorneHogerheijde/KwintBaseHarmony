using System.Text.Json;
using KwintBaseHarmony.Data;
using KwintBaseHarmony.Models;
using Microsoft.EntityFrameworkCore;

namespace KwintBaseHarmony.Services;

/// <summary>
/// Business logic service for Composition CRUD operations, validation, and serialization.
/// Handles JSON encoding/decoding and database persistence.
/// </summary>
public interface ICompositionService
{
    Task<Composition> CreateAsync(string studentId, string title, string difficulty);
    Task<Composition?> GetByIdAsync(Guid compositionId);
    Task<List<Composition>> GetByStudentIdAsync(string studentId);
    Task<Composition> UpdateAsync(Composition composition);
    Task<bool> DeleteAsync(Guid compositionId);
    Task<Composition> AddNoteToLayerAsync(Guid compositionId, int layerNumber, Note note);
    Task<Composition> CompleteLayerAsync(Guid compositionId, int layerNumber);
    Task<Composition> ValidateAndSaveAsync(Composition composition);
    string SerializeToJson(Composition composition);
    Composition DeserializeFromJson(string json);
}

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
    public async Task<Composition> CreateAsync(string studentId, string title, string difficulty)
    {
        var composition = new Composition
        {
            StudentId = studentId,
            Title = title,
            Difficulty = difficulty,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

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
    /// </summary>
    public async Task<Composition> CompleteLayerAsync(Guid compositionId, int layerNumber)
    {
        var composition = await GetByIdAsync(compositionId)
            ?? throw new KeyNotFoundException($"Composition {compositionId} not found");

        var layer = composition.Layers.FirstOrDefault(l => l.LayerNumber == layerNumber)
            ?? throw new InvalidOperationException(
                $"Layer {layerNumber} not found in composition {compositionId}");

        layer.Completed = true;
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
        composition.ValidateLayers();
        composition.UpdateCompletionPercentage();
        composition.UpdatedAt = DateTime.UtcNow;

        _context.Compositions.Update(composition);
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
        var json = JsonSerializer.Serialize(composition, new JsonSerializerOptions
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

        var composition = JsonSerializer.Deserialize<Composition>(json, options)
            ?? throw new InvalidOperationException("Failed to deserialize JSON to Composition");

        // Validate structure
        composition.ValidateLayers();

        _logger.LogDebug("Deserialized composition {CompositionId} from JSON", composition.Id);
        return composition;
    }

    private static string GetDefaultLayerName(int layerNumber) => layerNumber switch
    {
        1 => "Foundation (Root + 5th)",
        2 => "Adding the Third",
        3 => "The Major Triad",
        4 => "Seventh Chord",
        5 => "Extensions",
        6 => "Alterations",
        7 => "Final Composition",
        _ => $"Layer {layerNumber}"
    };

    private static string GetDefaultLayerConcept(int layerNumber) => layerNumber switch
    {
        1 => "Understanding the perfect 5th—the stable foundation",
        2 => "Completing the major triad with the third",
        3 => "The complete three-note chord: root, third, fifth",
        4 => "Adding color with sevenths and extended intervals",
        5 => "Extensions: ninths, elevenths, thirteenths",
        6 => "Alterations and chromatic movement",
        7 => "Bringing it all together: your complete composition",
        _ => $"Layer {layerNumber} concept"
    };
}
