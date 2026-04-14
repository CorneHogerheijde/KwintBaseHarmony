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
    /// Collection of harmonic layers (5-7 layers per Kwintessence structure).
    /// </summary>
    public ICollection<Layer> Layers { get; set; } = new List<Layer>();

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
