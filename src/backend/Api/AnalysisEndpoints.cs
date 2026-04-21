using System.Security.Claims;
using KwintBaseHarmony.Services;
using Microsoft.IdentityModel.JsonWebTokens;

namespace KwintBaseHarmony.Api;

public static class AnalysisEndpoints
{
    public static IEndpointRouteBuilder MapAnalysisEndpoints(this IEndpointRouteBuilder app)
    {
        var analysis = app.MapGroup("/api/analysis").RequireAuthorization();

        // POST /api/analysis/chord-chart
        // Parses a chord chart string and returns a new composition pre-filled with chord tones,
        // plus a list of parsed chords and a harmonic explanation.
        analysis.MapPost("chord-chart", async (
            AnalyseChordChartRequest request,
            ClaimsPrincipal principal,
            IAnalysisService analysisService,
            ILogger<Program> logger) =>
        {
            if (string.IsNullOrWhiteSpace(request.StudentId))
                return Results.BadRequest(new { error = "StudentId is required" });

            if (string.IsNullOrWhiteSpace(request.Title))
                return Results.BadRequest(new { error = "Title is required" });

            if (string.IsNullOrWhiteSpace(request.ChordChart))
                return Results.BadRequest(new { error = "ChordChart is required" });

            var userIdClaim = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            Guid? userId = userIdClaim is not null && Guid.TryParse(userIdClaim, out var uid) ? uid : null;

            try
            {
                var chords = analysisService.ParseChordChart(request.ChordChart);
                var composition = await analysisService.CreateFromChordChartAsync(
                    request.StudentId, request.Title, chords, userId);
                var explanation = analysisService.Explain(chords);

                var chordResponses = chords
                    .Select(c => new ChordTokenResponse(c.Symbol, c.Root, c.RootMidi, c.Quality, c.IsMinor))
                    .ToList();

                logger.LogInformation(
                    "Chord chart analysed: {ChordCount} chords, composition {CompositionId}",
                    chords.Count, composition.Id);

                var response = new ChordChartAnalysisResponse(
                    composition.ToResponse(),
                    chordResponses,
                    explanation);

                return Results.Created($"/api/compositions/{composition.Id}", response);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        });

        // GET /api/analysis/explain?chart=C-G-Am-F
        // Returns only the harmonic explanation without creating a composition.
        analysis.MapGet("explain", (
            string chart,
            IAnalysisService analysisService) =>
        {
            if (string.IsNullOrWhiteSpace(chart))
                return Results.BadRequest(new { error = "chart query parameter is required" });

            try
            {
                var chords = analysisService.ParseChordChart(chart);
                var explanation = analysisService.Explain(chords);
                var chordResponses = chords
                    .Select(c => new ChordTokenResponse(c.Symbol, c.Root, c.RootMidi, c.Quality, c.IsMinor))
                    .ToList();
                return Results.Ok(new { chords = chordResponses, explanation });
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        });

        return app;
    }
}
