namespace KwintBaseHarmony.Services;

/// <summary>
/// Represents a single parsed chord from a chord chart.
/// </summary>
/// <param name="Symbol">Raw symbol as entered by the user, e.g. "Am", "G7", "Bbmaj7".</param>
/// <param name="Root">Root note name, e.g. "C", "F#", "Bb".</param>
/// <param name="RootMidi">MIDI note number for the root in octave 4 (e.g. C4=60).</param>
/// <param name="Quality">Chord quality: "major", "minor", "dominant7", "major7", "minor7", "diminished", "augmented".</param>
/// <param name="IsMinor">Whether this chord has a minor quality.</param>
public sealed record ChordToken(
    string Symbol,
    string Root,
    int RootMidi,
    string Quality,
    bool IsMinor);
