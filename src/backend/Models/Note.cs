using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KwintBaseHarmony.Models;

/// <summary>
/// Represents a single note played within a layer.
/// </summary>
[Table("Notes")]
public class Note
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Foreign key to the parent Layer.
    /// </summary>
    [Required]
    public Guid LayerId { get; set; }

    /// <summary>
    /// MIDI pitch number (0-127). Standard mapping: Middle C = 60.
    /// Valid range for 88-key piano: 21-108 (C1 to C8).
    /// </summary>
    [Required]
    [Range(0, 127)]
    public int Pitch { get; set; }

    /// <summary>
    /// Duration of the note in milliseconds.
    /// Typical range: 250-2000ms for learning context.
    /// </summary>
    [Required]
    [Range(1, int.MaxValue)]
    public int DurationMs { get; set; }

    /// <summary>
    /// Timing offset within the layer in milliseconds.
    /// Allows notes to play sequentially or simultaneously.
    /// </summary>
    [Required]
    [Range(0, int.MaxValue)]
    public int TimingMs { get; set; }

    /// <summary>
    /// MIDI velocity (0-127). 0 = note off, 100-127 = typical playback range.
    /// Defaults to 100 for consistent student-friendly audio.
    /// </summary>
    [Required]
    [Range(0, 127)]
    public int Velocity { get; set; } = 100;

    /// <summary>
    /// Timestamp when this note was created.
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Navigation property to parent Layer.
    /// </summary>
    public Layer? Layer { get; set; }
}
