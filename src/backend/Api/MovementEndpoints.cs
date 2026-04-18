using KwintBaseHarmony.Services;

namespace KwintBaseHarmony.Api;

public static class MovementEndpoints
{
    public static IEndpointRouteBuilder MapMovementEndpoints(this IEndpointRouteBuilder app)
    {
        var compositions = app.MapGroup("/api/compositions").RequireAuthorization();

        compositions.MapPost("/{id:guid}/movements", async (
            Guid id,
            ICompositionService compositionService,
            ILogger<Program> logger) =>
        {
            try
            {
                var nextMovement = await compositionService.CreateNextMovementAsync(id);
                logger.LogInformation(
                    "Created movement {MovementNumber} for composition chain starting at {CompositionId}",
                    nextMovement.MovementNumber, id);

                return Results.Created($"/api/compositions/{nextMovement.Id}", nextMovement.ToResponse());
            }
            catch (KeyNotFoundException exception)
            {
                return Results.NotFound(new { error = exception.Message });
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { error = exception.Message });
            }
        });

        compositions.MapGet("/{id:guid}/movements", async (
            Guid id,
            ICompositionService compositionService) =>
        {
            try
            {
                var chain = await compositionService.GetMovementChainAsync(id);
                return Results.Ok(chain.Select(c => c.ToResponse()).ToList());
            }
            catch (KeyNotFoundException exception)
            {
                return Results.NotFound(new { error = exception.Message });
            }
        });

        return app;
    }
}
