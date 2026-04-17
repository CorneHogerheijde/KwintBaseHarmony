using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KwintBaseHarmony.Models;

/// <summary>
/// Represents a complete musical composition created by a student.
/// Composed of 5-7 Kwintessence layers, tracking all choices and progress.
/// </summary>
[Table("Compositions")]
public class Composition
{
    private static readonly HashSet<string> AllowedDifficultyValues = new(StringComparer.OrdinalIgnoreCase)
    {
        "beginner",
        "intermediate",
        "advanced"
    };

    private static readonly HashSet<string> AllowedStyleValues = new(StringComparer.OrdinalIgnoreCase)
    {
        "classical",
        "jazz",
        "blues"
    };

    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Student identifier (foreign key reference).
    /// Links composition to student account.
    /// </summary>
    [Required]
    [StringLength(255)]
    public string StudentId { get; set; } = "";

    /// <summary>
    /// Human-readable title for this composition (e.g., "My First Harmony").
    /// </summary>
    [Required]
    [StringLength(255)]
    public string Title { get; set; } = "";

    /// <summary>
    /// Difficulty level: "beginner", "intermediate", "advanced".
    /// Determines which puzzle types and layer complexity available.
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Difficulty { get; set; } = "beginner";

    /// <summary>
    /// Completion percentage (0-100).
    /// Calculated as: (completed layers / 5-7) * 100.
    /// Useful for progress UI and analytics.
    /// </summary>
    [Required]
    [Range(0, 100)]
    public decimal CompletionPercentage { get; set; } = 0;

    /// <summary>
    /// Timestamp when composition was created.
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when composition was last modified.
    /// </summary>
    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// MIDI note number of the transposition root chosen by the student (default 60 = C).
    /// Used to restore the student's preferred key on reload.
    /// </summary>
    [Required]
    [Range(0, 127)]
    public int RootMidi { get; set; } = 60;

    /// <summary>
    /// Movement number within a multi-movement piece: 1 = first, 2 = second, 3 = third.
    /// A movement chain shares the same tonal centre (RootMidi) and student.
    /// </summary>
    [Required]
    [Range(1, 3)]
    public int MovementNumber { get; set; } = 1;

    /// <summary>
    /// Parent composition ID — null for movement 1; points to the movement-1 Composition
    /// for movements 2 and 3. Used to identify and traverse a movement chain.
    /// </summary>
    public Guid? ParentCompositionId { get; set; }

    /// <summary>
    /// Navigation property to the parent composition (movement 1) for movements 2 and 3.
    /// </summary>
    public Composition? ParentComposition { get; set; }

    /// <summary>
    /// Style preset: "classical", "jazz", or "blues".
    /// Determines style-specific target notes for each layer.
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Style { get; set; } = "classical";

    /// <summary>
    /// Collection of harmonic layers (5-7 layers per Kwintessence structure).
    /// </summary>
    public ICollection<Layer> Layers { get; set; } = new List<Layer>();

    /// <summary>
    /// Validates required metadata and normalizes difficulty values before persistence.
    /// </summary>
    public void ValidateMetadata()
    {
        Validator.ValidateObject(this, new ValidationContext(this), validateAllProperties: true);

        if (!AllowedDifficultyValues.Contains(Difficulty))
        {
            throw new InvalidOperationException(
                $"Difficulty must be one of: {string.Join(", ", AllowedDifficultyValues.OrderBy(value => value))}");
        }

        Difficulty = Difficulty.ToLowerInvariant();

        if (!AllowedStyleValues.Contains(Style))
        {
            throw new InvalidOperationException(
                $"Style must be one of: {string.Join(", ", AllowedStyleValues.OrderBy(value => value))}");
        }

        Style = Style.ToLowerInvariant();
    }

    /// <summary>
    /// Validates that composition has exactly 5-7 layers.
    /// Throws InvalidOperationException if validation fails.
    /// </summary>
    public void ValidateLayers()
    {
        if (Layers.Count < 5 || Layers.Count > 7)
        {
            throw new InvalidOperationException(
                $"Composition must have 5-7 layers. Current count: {Layers.Count}");
        }

        // Validate layer numbers are sequential and in 1-7 range
        var layerNumbers = Layers.Select(l => l.LayerNumber).OrderBy(n => n).ToList();
        for (int i = 0; i < layerNumbers.Count; i++)
        {
            if (layerNumbers[i] != i + 1)
            {
                throw new InvalidOperationException(
                    $"Layer numbers must be sequential (1, 2, 3, ...). Found: {string.Join(", ", layerNumbers)}");
            }
        }
    }

    /// <summary>
    /// Calculates and updates CompletionPercentage based on completed layers.
    /// </summary>
    public void UpdateCompletionPercentage()
    {
        if (Layers.Count == 0)
        {
            CompletionPercentage = 0;
            return;
        }

        int completedCount = Layers.Count(l => l.Completed);
        CompletionPercentage = Math.Round(((decimal)completedCount / Layers.Count) * 100, 1);
    }
}
