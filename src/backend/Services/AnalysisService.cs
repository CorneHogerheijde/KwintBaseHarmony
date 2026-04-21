using System.Text;
using System.Text.RegularExpressions;
using KwintBaseHarmony.Models;

namespace KwintBaseHarmony.Services;

/// <summary>
/// Parses chord charts and creates pre-filled compositions from chord progressions.
///
/// Supported chord notations:
///   - Major: C, G, D, A, E, B, F#, Gb, Bb, Eb, Ab, Db
///   - Minor: Am, Dm, Em (suffix "m" or "min")
///   - Dominant 7th: G7, A7
///   - Major 7th: Cmaj7, Fmaj7
///   - Minor 7th: Am7, Dm7
///   - Diminished: Bdim
///   - Augmented: Caug
///   - Separators: any of - , / | or whitespace between chords
/// </summary>
public sealed class AnalysisService : IAnalysisService
{
    private static readonly Dictionary<string, int> RootSemitonesFromC = new(StringComparer.OrdinalIgnoreCase)
    {
        ["C"]  = 0,  ["B#"]  = 0,
        ["C#"] = 1,  ["Db"]  = 1,
        ["D"]  = 2,
        ["D#"] = 3,  ["Eb"]  = 3,
        ["E"]  = 4,  ["Fb"]  = 4,
        ["F"]  = 5,  ["E#"]  = 5,
        ["F#"] = 6,  ["Gb"]  = 6,
        ["G"]  = 7,
        ["G#"] = 8,  ["Ab"]  = 8,
        ["A"]  = 9,
        ["A#"] = 10, ["Bb"]  = 10,
        ["B"]  = 11, ["Cb"]  = 11,
    };

    // Canonical display name for each semitone (prefer sharps)
    private static readonly string[] CanonicalRootName =
    [
        "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
    ];

    // How chord quality affects the layers we populate
    private static readonly Dictionary<string, int[]> QualityIntervals = new()
    {
        // intervals in semitones above root: root, 3rd, 5th, 7th (if present)
        ["major"]      = [0, 4, 7],
        ["minor"]      = [0, 3, 7],
        ["dominant7"]  = [0, 4, 7, 10],
        ["major7"]     = [0, 4, 7, 11],
        ["minor7"]     = [0, 3, 7, 10],
        ["diminished"] = [0, 3, 6],
        ["augmented"]  = [0, 4, 8],
    };

    // Regex: captures root (with optional accidental) + optional suffix
    private static readonly Regex ChordRegex = new(
        @"(?<root>[A-Ga-g][#b]?)(?<suffix>maj7|min7|dim7|aug|dim|maj|min|m7|M7|7|m)?",
        RegexOptions.Compiled);

    private static readonly Regex SeparatorRegex = new(
        @"[\s\-,/|]+",
        RegexOptions.Compiled);

    private readonly ICompositionService _compositionService;

    public AnalysisService(ICompositionService compositionService)
    {
        _compositionService = compositionService;
    }

    // ── IAnalysisService ──────────────────────────────────────────────────────

    public List<ChordToken> ParseChordChart(string chordChart)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(chordChart);

        var tokens = new List<ChordToken>();
        var parts = SeparatorRegex.Split(chordChart.Trim());

        foreach (var part in parts)
        {
            if (string.IsNullOrWhiteSpace(part))
                continue;

            var token = ParseSingleChord(part.Trim());
            if (token is not null)
                tokens.Add(token);
        }

        if (tokens.Count == 0)
            throw new ArgumentException("No recognisable chords found in the chart.", nameof(chordChart));

        return tokens;
    }

    public async Task<Composition> CreateFromChordChartAsync(
        string studentId,
        string title,
        List<ChordToken> chords,
        Guid? userId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(studentId);
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        if (chords is null || chords.Count == 0)
            throw new ArgumentException("At least one chord is required.", nameof(chords));

        // Derive a root key from the first chord
        var rootMidi = chords[0].RootMidi;

        // Create the base composition
        var composition = await _compositionService.CreateAsync(studentId, title, "intermediate", "classical", userId);

        // Set root MIDI to the first chord's root and persist via UpdateAsync
        composition.RootMidi = rootMidi;
        composition = await _compositionService.UpdateAsync(composition);

        // Pre-populate layers with chord tones via the composition service
        var pitches = BuildLayerIntervals(chords);
        var layerList = composition.Layers.ToList();
        for (var i = 0; i < Math.Min(pitches.Count, layerList.Count); i++)
        {
            composition = await _compositionService.AddNoteToLayerAsync(
                composition.Id,
                layerList[i].LayerNumber,
                new Note
                {
                    Pitch = pitches[i],
                    DurationMs = 1000,
                    TimingMs = i * 1000,
                    Velocity = 80,
                });
        }

        return composition;
    }

    public string Explain(List<ChordToken> chords)
    {
        if (chords is null || chords.Count == 0)
            return "No chords to explain.";

        var sb = new StringBuilder();
        sb.AppendLine($"This progression uses {chords.Count} chord{(chords.Count == 1 ? "" : "s")}:");
        sb.AppendLine();

        for (var i = 0; i < chords.Count; i++)
        {
            var chord = chords[i];
            var role = GetHarmonicRole(chord, chords[0]);
            sb.AppendLine($"  {i + 1}. {chord.Symbol} ({chord.Quality}) — {role}");
        }

        sb.AppendLine();
        sb.AppendLine(BuildProgressionSummary(chords));

        return sb.ToString().TrimEnd();
    }

    // ── Parsing ───────────────────────────────────────────────────────────────

    private static ChordToken? ParseSingleChord(string raw)
    {
        var match = ChordRegex.Match(raw);
        if (!match.Success || match.Length == 0)
            return null;

        var rootRaw = match.Groups["root"].Value;
        // Normalise: capitalise first letter, lowercase 'b'
        var rootNorm = NormaliseRoot(rootRaw);

        if (!RootSemitonesFromC.TryGetValue(rootNorm, out var semitones))
            return null;

        var canonicalRoot = CanonicalRootName[semitones % 12];
        var rootMidi = 60 + semitones; // octave 4

        var suffix = match.Groups["suffix"].Value.ToLowerInvariant();
        var (quality, isMinor) = ParseQuality(suffix);

        return new ChordToken(raw, canonicalRoot, rootMidi, quality, isMinor);
    }

    private static string NormaliseRoot(string root)
    {
        if (root.Length == 0) return root;
        return char.ToUpperInvariant(root[0]) + root[1..].ToLowerInvariant();
    }

    private static (string quality, bool isMinor) ParseQuality(string suffix) => suffix switch
    {
        "maj7" or "m7" when suffix == "maj7"  => ("major7",      false),
        "min7" or "m7"                         => ("minor7",      true),
        "dim" or "dim7"                        => ("diminished",  true),
        "aug"                                  => ("augmented",   false),
        "maj"                                  => ("major",       false),
        "min" or "m"                           => ("minor",       true),
        "7"                                    => ("dominant7",   false),
        ""                                     => ("major",       false),
        _                                      => ("major",       false),
    };

    // ── Layer building ────────────────────────────────────────────────────────

    /// <summary>
    /// Builds a list of MIDI pitches to assign to the 7 composition layers.
    /// Strategy: distribute chord tones from the progression across layers.
    /// </summary>
    private static List<int> BuildLayerIntervals(List<ChordToken> chords)
    {
        var pitches = new List<int>();

        foreach (var chord in chords)
        {
            if (!QualityIntervals.TryGetValue(chord.Quality, out var intervals))
                intervals = QualityIntervals["major"];

            foreach (var interval in intervals)
            {
                var midi = chord.RootMidi + interval;
                if (!pitches.Contains(midi))
                    pitches.Add(midi);

                if (pitches.Count >= 7)
                    return pitches;
            }
        }

        // Pad with root octave-up if fewer than 7 unique pitches
        while (pitches.Count < 7 && pitches.Count > 0)
            pitches.Add(pitches[pitches.Count - 1] + 12);

        return pitches;
    }

    // ── Explanation helpers ───────────────────────────────────────────────────

    private static string GetHarmonicRole(ChordToken chord, ChordToken tonic)
    {
        var interval = (chord.RootMidi - tonic.RootMidi + 12) % 12;
        return (interval, chord.IsMinor) switch
        {
            (0,  false) => "Tonic (I) — home chord, point of rest",
            (0,  true)  => "Tonic minor (i) — home chord with a darker colour",
            (2,  true)  => "Supertonic minor (ii) — often leads to the dominant",
            (4,  true)  => "Mediant minor (iii) — adds colour and tension",
            (5,  false) => "Subdominant (IV) — movement away from tonic",
            (5,  true)  => "Subdominant minor (iv) — darker departure from tonic",
            (7,  false) => "Dominant (V) — strong pull back to tonic",
            (7,  true)  => "Dominant minor (v) — softer pull to tonic",
            (9,  true)  => "Submediant minor (vi) — relative minor, emotional depth",
            (9,  false) => "Submediant major (VI) — unexpected brightness",
            (11, false) => "Leading-tone chord (VII) — unstable, resolves upward",
            _           => $"Non-diatonic chord ({interval} semitones from tonic)"
        };
    }

    private static string BuildProgressionSummary(List<ChordToken> chords)
    {
        if (chords.Count < 2) return "";

        // Check for common progressions
        var intervals = chords.Select(c => (c.RootMidi - chords[0].RootMidi + 12) % 12).ToArray();

        return intervals switch
        {
            [0, 7, 9, 5] => "This is the popular I–V–vi–IV progression, used in countless pop songs.",
            [0, 5, 7, 5] => "This is a I–IV–V–IV pattern, common in blues and rock.",
            [0, 5, 9, 7] => "This is a I–IV–vi–V progression with a strong sense of resolution.",
            [0, 9, 5, 7] => "This is a I–vi–IV–V pattern, the classic '50s progression.",
            [0, 7, 0, 7] => "Alternating tonic and dominant — a simple but effective oscillation.",
            _ => $"The progression moves through {chords.Count} chords, " +
                 $"starting on {chords[0].Symbol} and ending on {chords[^1].Symbol}."
        };
    }
}
