using KwintBaseHarmony.Models;
using KwintBaseHarmony.Services;
using Microsoft.AspNetCore.Mvc;

namespace KwintBaseHarmony.Controllers;

/// <summary>
/// REST API for Composition CRUD operations.
/// Endpoints for creating, retrieving, updating, and deleting compositions.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CompositionsController : ControllerBase
{
    private readonly ICompositionService _compositionService;
    private readonly IMidiExportService _midiExportService;
    private readonly ILogger<CompositionsController> _logger;

    public CompositionsController(
        ICompositionService compositionService,
        IMidiExportService midiExportService,
        ILogger<CompositionsController> logger)
    {
        _compositionService = compositionService;
        _midiExportService = midiExportService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new composition with 7 empty layers.
    /// </summary>
    /// <param name="request">Composition details (studentId, title, difficulty)</param>
    /// <returns>201 Created with new composition</returns>
    [HttpPost]
    [ProduceResponseType(StatusCodes.Status201Created)]
    [ProduceResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CompositionResponse>> CreateComposition([FromBody] CreateCompositionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.StudentId))
            return BadRequest(new { error = "StudentId is required" });

        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { error = "Title is required" });

        var composition = await _compositionService.CreateAsync(
            request.StudentId,
            request.Title,
            request.Difficulty ?? "beginner");

        _logger.LogInformation("Created composition {CompositionId} for student {StudentId}",
            composition.Id, request.StudentId);

        return CreatedAtAction(nameof(GetComposition), new { id = composition.Id },
            MapToResponse(composition));
    }

    /// <summary>
    /// Get a composition by ID with all layers and notes.
    /// </summary>
    /// <param name="id">Composition ID</param>
    /// <returns>200 OK with composition data</returns>
    [HttpGet("{id}")]
    [ProduceResponseType(StatusCodes.Status200OK)]
    [ProduceResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CompositionResponse>> GetComposition(Guid id)
    {
        var composition = await _compositionService.GetByIdAsync(id);
        if (composition == null)
            return NotFound(new { error = $"Composition {id} not found" });

        return Ok(MapToResponse(composition));
    }

    /// <summary>
    /// Get all compositions for a specific student.
    /// </summary>
    /// <param name="studentId">Student ID</param>
    /// <returns>200 OK with list of compositions</returns>
    [HttpGet("student/{studentId}")]
    [ProduceResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CompositionResponse>>> GetStudentCompositions(string studentId)
    {
        var compositions = await _compositionService.GetByStudentIdAsync(studentId);
        return Ok(compositions.Select(MapToResponse).ToList());
    }

    /// <summary>
    /// Update composition (title, difficulty, completion status).
    /// </summary>
    /// <param name="id">Composition ID</param>
    /// <param name="request">Update details</param>
    /// <returns>200 OK with updated composition</returns>
    [HttpPut("{id}")]
    [ProduceResponseType(StatusCodes.Status200OK)]
    [ProduceResponseType(StatusCodes.Status404NotFound)]
    [ProduceResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CompositionResponse>> UpdateComposition(Guid id, [FromBody] UpdateCompositionRequest request)
    {
        var composition = await _compositionService.GetByIdAsync(id);
        if (composition == null)
            return NotFound(new { error = $"Composition {id} not found" });

        if (!string.IsNullOrWhiteSpace(request.Title))
            composition.Title = request.Title;

        if (!string.IsNullOrWhiteSpace(request.Difficulty))
            composition.Difficulty = request.Difficulty;

        composition.UpdatedAt = DateTime.UtcNow;

        var updated = await _compositionService.UpdateAsync(composition);

        _logger.LogInformation("Updated composition {CompositionId}", id);

        return Ok(MapToResponse(updated));
    }

    /// <summary>
    /// Delete a composition and all associated layers/notes.
    /// </summary>
    /// <param name="id">Composition ID</param>
    /// <returns>204 No Content</returns>
    [HttpDelete("{id}")]
    [ProduceResponseType(StatusCodes.Status204NoContent)]
    [ProduceResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteComposition(Guid id)
    {
        var deleted = await _compositionService.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { error = $"Composition {id} not found" });

        _logger.LogInformation("Deleted composition {CompositionId}", id);

        return NoContent();
    }

    /// <summary>
    /// Add a note to a specific layer in the composition.
    /// </summary>
    /// <param name="id">Composition ID</param>
    /// <param name="layerNumber">Layer number (1-7)</param>
    /// <param name="request">Note details (pitch, duration, timing, velocity)</param>
    /// <returns>201 Created with updated composition</returns>
    [HttpPost("{id}/layers/{layerNumber:int}/notes")]
    [ProduceResponseType(StatusCodes.Status201Created)]
    [ProduceResponseType(StatusCodes.Status404NotFound)]
    [ProduceResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CompositionResponse>> AddNoteToLayer(
        Guid id,
        int layerNumber,
        [FromBody] AddNoteRequest request)
    {
        if (layerNumber < 1 || layerNumber > 7)
            return BadRequest(new { error = "Layer number must be between 1 and 7" });

        if (request.Pitch < 0 || request.Pitch > 127)
            return BadRequest(new { error = "Pitch must be between 0 and 127 (MIDI)" });

        if (request.DurationMs <= 0)
            return BadRequest(new { error = "Duration must be greater than 0" });

        var note = new Note
        {
            Pitch = request.Pitch,
            DurationMs = request.DurationMs,
            TimingMs = request.TimingMs,
            Velocity = Math.Clamp(request.Velocity ?? 100, 0, 127),
            CreatedAt = DateTime.UtcNow
        };

        var composition = await _compositionService.AddNoteToLayerAsync(id, layerNumber, note);
        if (composition == null)
            return NotFound(new { error = $"Composition {id} or layer {layerNumber} not found" });

        _logger.LogInformation("Added note to composition {CompositionId} layer {LayerNumber}",
            id, layerNumber);

        return CreatedAtAction(nameof(GetComposition), new { id },
            MapToResponse(composition));
    }

    /// <summary>
    /// Mark a layer as completed and update overall completion percentage.
    /// </summary>
    /// <param name="id">Composition ID</param>
    /// <param name="layerNumber">Layer number (1-7)</param>
    /// <returns>200 OK with updated composition</returns>
    [HttpPost("{id}/layers/{layerNumber:int}/complete")]
    [ProduceResponseType(StatusCodes.Status200OK)]
    [ProduceResponseType(StatusCodes.Status404NotFound)]
    [ProduceResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CompositionResponse>> CompleteLayer(Guid id, int layerNumber)
    {
        if (layerNumber < 1 || layerNumber > 7)
            return BadRequest(new { error = "Layer number must be between 1 and 7" });

        var composition = await _compositionService.CompleteLayerAsync(id, layerNumber);
        if (composition == null)
            return NotFound(new { error = $"Composition {id} or layer {layerNumber} not found" });

        _logger.LogInformation("Completed layer {LayerNumber} in composition {CompositionId}",
            layerNumber, id);

        return Ok(MapToResponse(composition));
    }

    /// <summary>
    /// Export composition to MIDI file (binary).
    /// </summary>
    /// <param name="id">Composition ID</param>
    /// <returns>200 OK with MIDI file bytes</returns>
    [HttpGet("{id}/export/midi")]
    [Produces("audio/midi")]
    [ProduceResponseType(StatusCodes.Status200OK)]
    [ProduceResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> ExportMidi(Guid id)
    {
        var composition = await _compositionService.GetByIdAsync(id);
        if (composition == null)
            return NotFound(new { error = $"Composition {id} not found" });

        var midiData = await _midiExportService.CompositionToMidiAsync(composition);

        _logger.LogInformation("Exported composition {CompositionId} to MIDI ({Bytes} bytes)",
            id, midiData.Length);

        return File(midiData, "audio/midi", $"composition-{id}.mid");
    }

    /// <summary>
    /// Export composition as JSON (for API transfer/backup).
    /// </summary>
    /// <param name="id">Composition ID</param>
    /// <returns>200 OK with JSON representation</returns>
    [HttpGet("{id}/export/json")]
    [Produces("application/json")]
    [ProduceResponseType(StatusCodes.Status200OK)]
    [ProduceResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<string>> ExportJson(Guid id)
    {
        var composition = await _compositionService.GetByIdAsync(id);
        if (composition == null)
            return NotFound(new { error = $"Composition {id} not found" });

        var json = _compositionService.SerializeToJson(composition);

        _logger.LogInformation("Exported composition {CompositionId} to JSON", id);

        return Ok(json);
    }

    /// <summary>
    /// Import composition from JSON.
    /// </summary>
    /// <param name="request">JSON string to import</param>
    /// <returns>201 Created with imported composition</returns>
    [HttpPost("import/json")]
    [ProduceResponseType(StatusCodes.Status201Created)]
    [ProduceResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CompositionResponse>> ImportJson([FromBody] ImportJsonRequest request)
    {
        try
        {
            var composition = _compositionService.DeserializeFromJson(request.Json);
            var saved = await _compositionService.ValidateAndSaveAsync(composition);

            _logger.LogInformation("Imported composition {CompositionId} from JSON", saved.Id);

            return CreatedAtAction(nameof(GetComposition), new { id = saved.Id },
                MapToResponse(saved));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to import JSON");
            return BadRequest(new { error = "Invalid JSON format or content", details = ex.Message });
        }
    }

    private static CompositionResponse MapToResponse(Composition composition)
    {
        return new CompositionResponse
        {
            Id = composition.Id,
            StudentId = composition.StudentId,
            Title = composition.Title,
            Difficulty = composition.Difficulty,
            CompletionPercentage = composition.CompletionPercentage,
            CreatedAt = composition.CreatedAt,
            UpdatedAt = composition.UpdatedAt,
            Layers = composition.Layers.Select(l => new LayerResponse
            {
                LayerNumber = l.LayerNumber,
                Name = l.Name,
                Concept = l.Concept,
                Completed = l.Completed,
                TimeSpentMs = l.TimeSpentMs,
                UserNotes = l.UserNotes,
                Notes = l.Notes.Select(n => new NoteResponse
                {
                    Pitch = n.Pitch,
                    DurationMs = n.DurationMs,
                    TimingMs = n.TimingMs,
                    Velocity = n.Velocity,
                    CreatedAt = n.CreatedAt
                }).ToList()
            }).ToList()
        };
    }
}

// DTO Requests
public class CreateCompositionRequest
{
    public string StudentId { get; set; } = "";
    public string Title { get; set; } = "";
    public string? Difficulty { get; set; }
}

public class UpdateCompositionRequest
{
    public string? Title { get; set; }
    public string? Difficulty { get; set; }
}

public class AddNoteRequest
{
    public int Pitch { get; set; }
    public int DurationMs { get; set; }
    public int TimingMs { get; set; }
    public int? Velocity { get; set; }
}

public class ImportJsonRequest
{
    public string Json { get; set; } = "";
}

// DTO Responses
public class CompositionResponse
{
    public Guid Id { get; set; }
    public string StudentId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Difficulty { get; set; } = "";
    public decimal CompletionPercentage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<LayerResponse> Layers { get; set; } = new();
}

public class LayerResponse
{
    public int LayerNumber { get; set; }
    public string Name { get; set; } = "";
    public string Concept { get; set; } = "";
    public bool Completed { get; set; }
    public long TimeSpentMs { get; set; }
    public string? UserNotes { get; set; }
    public List<NoteResponse> Notes { get; set; } = new();
}

public class NoteResponse
{
    public int Pitch { get; set; }
    public int DurationMs { get; set; }
    public int TimingMs { get; set; }
    public int Velocity { get; set; }
    public DateTime CreatedAt { get; set; }
}
