using KwintBaseHarmony.Models;

namespace KwintBaseHarmony.Services;

/// <summary>
/// Parses a chord chart string and produces a pre-filled Composition.
/// </summary>
public interface IAnalysisService
{
    /// <summary>
    /// Parse a chord chart (e.g. "C - G - Am - F") into a list of chord tokens.
    /// </summary>
    List<ChordToken> ParseChordChart(string chordChart);

    /// <summary>
    /// Create a Composition pre-populated with layers derived from the chord progression.
    /// </summary>
    Task<Composition> CreateFromChordChartAsync(
        string studentId,
        string title,
        List<ChordToken> chords,
        Guid? userId = null);

    /// <summary>
    /// Generate a plain-English harmonic explanation for the chord progression.
    /// </summary>
    string Explain(List<ChordToken> chords);
}
