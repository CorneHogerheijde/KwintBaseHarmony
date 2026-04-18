using System.Text.Json;
using KwintBaseHarmony.Services;

namespace KwintBaseHarmony.Api;

public static class AnalyticsEndpoints
{
    public static IEndpointRouteBuilder MapAnalyticsEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/compositions/{id:guid}/analytics", async (
            Guid id,
            ICompositionService compositionService) =>
        {
            var composition = await compositionService.GetByIdAsync(id);
            if (composition is null)
                return Results.NotFound(new { error = $"Composition {id} not found" });

            var layerAnalytics = composition.Layers
                .OrderBy(layer => layer.LayerNumber)
                .Select(layer =>
                {
                    int? attempts = null;
                    bool? firstTryCorrect = null;

                    if (!string.IsNullOrEmpty(layer.PuzzleAnswersJson))
                    {
                        try
                        {
                            var doc = JsonDocument.Parse(layer.PuzzleAnswersJson);
                            var root = doc.RootElement;

                            if (root.TryGetProperty("attempts", out var attemptsElement))
                                attempts = attemptsElement.GetInt32();

                            if (root.TryGetProperty("firstTryCorrect", out var firstTryElement))
                                firstTryCorrect = firstTryElement.GetBoolean();
                        }
                        catch (JsonException)
                        {
                            // Malformed JSON — analytics fields stay null
                        }
                    }

                    return new LayerAnalyticsResponse(
                        layer.LayerNumber,
                        layer.Name,
                        layer.Completed,
                        layer.TimeSpentMs,
                        attempts,
                        firstTryCorrect);
                })
                .ToList();

            var completedLayers = layerAnalytics.Count(l => l.Completed);
            var totalTimeMs = layerAnalytics.Sum(l => l.TimeSpentMs);

            var layersWithAttempts = layerAnalytics.Where(l => l.Attempts.HasValue).ToList();
            double? avgAttempts = layersWithAttempts.Count > 0
                ? layersWithAttempts.Average(l => l.Attempts!.Value)
                : null;

            var layersWithFirstTry = layerAnalytics.Where(l => l.FirstTryCorrect.HasValue).ToList();
            double? firstTryRate = layersWithFirstTry.Count > 0
                ? layersWithFirstTry.Count(l => l.FirstTryCorrect == true) / (double)layersWithFirstTry.Count
                : null;

            var summary = new AnalyticsSummaryResponse(
                completedLayers,
                layerAnalytics.Count,
                totalTimeMs,
                avgAttempts,
                firstTryRate);

            return Results.Ok(new CompositionAnalyticsResponse(
                composition.Id,
                composition.Difficulty,
                composition.CompletionPercentage,
                summary,
                layerAnalytics));
        }).RequireAuthorization();

        return app;
    }
}
