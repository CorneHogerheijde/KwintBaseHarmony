using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KwintBaseHarmony.Models;

/// <summary>
/// Represents one harmonic layer in a Kwintessence-based composition.
/// Kwintessence pedagogy: 5-7 layers, each building on previous (Root+5th → +3rd → etc.).
/// </summary>
[Table("Layers")]
public class Layer
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Foreign key to parent Composition.
    /// </summary>
    [Required]
    public Guid CompositionId { get; set; }

    /// <summary>
    /// Layer number: 1-7 (enforced by Composition.ValidateLayers()).
    /// Layer 1 = Foundation (Root+5th)
    /// Layer 2 = +3rd
    /// Layer 3-7 = Progressive harmonic extensions
    /// </summary>
    [Required]
    [Range(1, 7)]
    public int LayerNumber { get; set; }

    /// <summary>
    /// Human-readable layer name (e.g., "Foundation (Root + 5th)").
    /// </summary>
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = "";

    /// <summary>
    /// Pedagogical concept for this layer (e.g., "Understanding the perfect 5th").
    /// </summary>
    [StringLength(500)]
    public string? Concept { get; set; }

    /// <summary>
    /// Whether the student has completed this layer.
    /// Unlocks progression to the next layer.
    /// </summary>
    [Required]
    public bool Completed { get; set; } = false;

    /// <summary>
    /// Time student spent on this layer in milliseconds.
    /// Useful for learning analytics and difficulty assessment.
    /// </summary>
    [Required]
    public long TimeSpentMs { get; set; } = 0;

    /// <summary>
    /// Optional student notes or reflections on this layer (e.g., "This was tricky!").
    /// </summary>
    [StringLength(1000)]
    public string? UserNotes { get; set; }

    /// <summary>
    /// Serialized JSON containing puzzle answers for this layer.
    /// Format: {"puzzleId": "...", "answerCorrect": true, "attempts": 3}
    /// Stored as JSON string to avoid extra tables.
    /// </summary>
    public string? PuzzleAnswersJson { get; set; }

    /// <summary>
    /// Timestamp when this layer was created.
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when this layer was last updated.
    /// </summary>
    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Navigation property to parent Composition.
    /// </summary>
    public Composition? Composition { get; set; }

    /// <summary>
    /// Collection of notes in this layer.
    /// </summary>
    public ICollection<Note> Notes { get; set; } = new List<Note>();
}
