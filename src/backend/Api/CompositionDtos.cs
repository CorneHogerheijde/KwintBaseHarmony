namespace KwintBaseHarmony.Api;

// ── Inbound requests ──────────────────────────────────────────────────────────

public sealed record CreateCompositionRequest(string StudentId, string Title, string? Difficulty, string? Style);

public sealed record UpdateCompositionRequest(string? Title, string? Difficulty);

public sealed record UpdateRootMidiRequest(int RootMidi);

public sealed record AddNoteRequest(int Pitch, int DurationMs, int TimingMs, int? Velocity);

public sealed record CompleteLayerRequest(int? Attempts, bool? FirstTryCorrect, long? TimeSpentMs);

public sealed record ImportJsonRequest(string Json);

// ── Outbound responses ────────────────────────────────────────────────────────

public sealed record CompositionResponse(
    Guid Id,
    string StudentId,
    string Title,
    string Difficulty,
    string Style,
    decimal CompletionPercentage,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int RootMidi,
    int MovementNumber,
    Guid? ParentCompositionId,
    List<LayerResponse> Layers);

public sealed record LayerResponse(
    int LayerNumber,
    string Name,
    string? Concept,
    bool Completed,
    long TimeSpentMs,
    string? UserNotes,
    string? PuzzleAnswersJson,
    List<NoteResponse> Notes);

public sealed record NoteResponse(
    int Pitch,
    int DurationMs,
    int TimingMs,
    int Velocity,
    DateTime CreatedAt);

public sealed record LayerAnalyticsResponse(
    int LayerNumber,
    string Name,
    bool Completed,
    long TimeSpentMs,
    int? Attempts,
    bool? FirstTryCorrect);

public sealed record AnalyticsSummaryResponse(
    int CompletedLayers,
    int TotalLayers,
    long TotalTimeSpentMs,
    double? AverageAttemptsPerLayer,
    double? FirstTryCorrectRate);

public sealed record CompositionAnalyticsResponse(
    Guid CompositionId,
    string Difficulty,
    decimal CompletionPercentage,
    AnalyticsSummaryResponse Summary,
    List<LayerAnalyticsResponse> Layers);
