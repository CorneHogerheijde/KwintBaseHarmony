using KwintBaseHarmony.Models;
using KwintBaseHarmony.Services;

namespace KwintBaseHarmony.Api;

public static class LayerEndpoints
{
    public static IEndpointRouteBuilder MapLayerEndpoints(this IEndpointRouteBuilder app)
    {
        var compositions = app.MapGroup("/api/compositions");

        compositions.MapPost("/{id:guid}/layers/{layerNumber:int}/notes", async (
            Guid id,
            int layerNumber,
            AddNoteRequest request,
            ICompositionService compositionService) =>
        {
            try
            {
                var note = new Note
                {
                    Pitch = request.Pitch,
                    DurationMs = request.DurationMs,
                    TimingMs = request.TimingMs,
                    Velocity = request.Velocity ?? 64
                };
                var composition = await compositionService.AddNoteToLayerAsync(id, layerNumber, note);

                return Results.Ok(composition.ToResponse());
            }
            catch (KeyNotFoundException exception)
            {
                return Results.NotFound(new { error = exception.Message });
            }
            catch (InvalidOperationException exception)
            {
                return Results.BadRequest(new { error = exception.Message });
            }
        });

        compositions.MapPost("/{id:guid}/layers/{layerNumber:int}/complete", async (
            Guid id,
            int layerNumber,
            CompleteLayerRequest request,
            ICompositionService compositionService) =>
        {
            try
            {
                var composition = await compositionService.CompleteLayerAsync(
                    id, layerNumber, request.Attempts, request.FirstTryCorrect, request.TimeSpentMs);

                return Results.Ok(composition.ToResponse());
            }
            catch (KeyNotFoundException exception)
            {
                return Results.NotFound(new { error = exception.Message });
            }
        });

        return app;
    }
}
