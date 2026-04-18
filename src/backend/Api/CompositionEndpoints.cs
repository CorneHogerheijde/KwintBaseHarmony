using KwintBaseHarmony.Services;

namespace KwintBaseHarmony.Api;

public static class CompositionEndpoints
{
    public static IEndpointRouteBuilder MapCompositionEndpoints(this IEndpointRouteBuilder app)
    {
        var compositions = app.MapGroup("/api/compositions");

        compositions.MapPost("", async (
            CreateCompositionRequest request,
            ICompositionService compositionService,
            ILogger<Program> logger) =>
        {
            if (string.IsNullOrWhiteSpace(request.StudentId))
                return Results.BadRequest(new { error = "StudentId is required" });

            if (string.IsNullOrWhiteSpace(request.Title))
                return Results.BadRequest(new { error = "Title is required" });

            try
            {
                var composition = await compositionService.CreateAsync(
                    request.StudentId,
                    request.Title,
                    request.Difficulty ?? "beginner",
                    request.Style ?? "classical");

                logger.LogInformation(
                    "Created composition {CompositionId} for student {StudentId}",
                    composition.Id, request.StudentId);

                return Results.Created($"/api/compositions/{composition.Id}", composition.ToResponse());
            }
            catch (InvalidOperationException exception)
            {
                return Results.UnprocessableEntity(new { error = exception.Message });
            }
        });

        compositions.MapGet("/{id:guid}", async (Guid id, ICompositionService compositionService) =>
        {
            var composition = await compositionService.GetByIdAsync(id);
            return composition is null
                ? Results.NotFound(new { error = $"Composition {id} not found" })
                : Results.Ok(composition.ToResponse());
        });

        compositions.MapGet("/student/{studentId}", async (string studentId, ICompositionService compositionService) =>
        {
            var results = await compositionService.GetByStudentIdAsync(studentId);
            return Results.Ok(results.Select(c => c.ToResponse()).ToList());
        });

        compositions.MapPut("/{id:guid}", async (
            Guid id,
            UpdateCompositionRequest request,
            ICompositionService compositionService,
            ILogger<Program> logger) =>
        {
            var composition = await compositionService.GetByIdAsync(id);
            if (composition is null)
                return Results.NotFound(new { error = $"Composition {id} not found" });

            if (!string.IsNullOrWhiteSpace(request.Title))
                composition.Title = request.Title;

            if (!string.IsNullOrWhiteSpace(request.Difficulty))
                composition.Difficulty = request.Difficulty;

            try
            {
                var updated = await compositionService.UpdateAsync(composition);
                logger.LogInformation("Updated composition {CompositionId}", id);
                return Results.Ok(updated.ToResponse());
            }
            catch (InvalidOperationException exception)
            {
                return Results.BadRequest(new { error = exception.Message });
            }
        });

        compositions.MapDelete("/{id:guid}", async (Guid id, ICompositionService compositionService, ILogger<Program> logger) =>
        {
            var deleted = await compositionService.DeleteAsync(id);
            if (!deleted)
                return Results.NotFound(new { error = $"Composition {id} not found" });

            logger.LogInformation("Deleted composition {CompositionId}", id);
            return Results.NoContent();
        });

        compositions.MapPatch("/{id:guid}/root-midi", async (
            Guid id,
            UpdateRootMidiRequest request,
            ICompositionService compositionService,
            ILogger<Program> logger) =>
        {
            if (request.RootMidi < 0 || request.RootMidi > 127)
                return Results.BadRequest(new { error = "RootMidi must be between 0 and 127" });

            var composition = await compositionService.GetByIdAsync(id);
            if (composition is null)
                return Results.NotFound(new { error = $"Composition {id} not found" });

            composition.RootMidi = request.RootMidi;
            var updated = await compositionService.UpdateAsync(composition);

            logger.LogInformation(
                "Updated root MIDI to {RootMidi} for composition {CompositionId}",
                request.RootMidi, id);

            return Results.Ok(updated.ToResponse());
        });

        return app;
    }
}
