namespace KwintBaseHarmony.Api;

// ── Inbound ───────────────────────────────────────────────────────────────────

/// <summary>
/// Request to analyse a chord chart and create a composition from it.
/// </summary>
/// <param name="StudentId">Student identifier.</param>
/// <param name="Title">Composition title.</param>
/// <param name="ChordChart">
/// Space- or dash-separated chord symbols, e.g. "C - G - Am - F"
/// </param>
public sealed record AnalyseChordChartRequest(string StudentId, string Title, string ChordChart);

// ── Outbound ──────────────────────────────────────────────────────────────────

/// <summary>
/// Parsed token returned to the client so the frontend can display chord info.
/// </summary>
public sealed record ChordTokenResponse(string Symbol, string Root, int RootMidi, string Quality, bool IsMinor);

/// <summary>
/// Full response from POST /api/analysis/chord-chart.
/// </summary>
public sealed record ChordChartAnalysisResponse(
    CompositionResponse Composition,
    List<ChordTokenResponse> Chords,
    string Explanation);
