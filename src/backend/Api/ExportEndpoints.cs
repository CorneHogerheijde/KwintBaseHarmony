using KwintBaseHarmony.Services;

namespace KwintBaseHarmony.Api;

public static class ExportEndpoints
{
    public static IEndpointRouteBuilder MapExportEndpoints(this IEndpointRouteBuilder app)
    {
        var compositions = app.MapGroup("/api/compositions").RequireAuthorization();

        compositions.MapGet("/{id:guid}/export/midi", async (
            Guid id,
            ICompositionService compositionService,
            IMidiExportService midiExportService) =>
        {
            var composition = await compositionService.GetByIdAsync(id);
            if (composition is null)
                return Results.NotFound(new { error = $"Composition {id} not found" });

            var midiBytes = await midiExportService.CompositionToMidiAsync(composition);
            return Results.File(midiBytes, "audio/midi", $"{composition.Title}.mid");
        });

        compositions.MapGet("/{id:guid}/export/json", async (
            Guid id,
            ICompositionService compositionService) =>
        {
            var composition = await compositionService.GetByIdAsync(id);
            if (composition is null)
                return Results.NotFound(new { error = $"Composition {id} not found" });

            var json = compositionService.SerializeToJson(composition);
            return Results.Ok(json);
        });

        compositions.MapPost("/import/json", async (
            ImportJsonRequest request,
            ICompositionService compositionService,
            ILogger<Program> logger) =>
        {
            try
            {
                var composition = compositionService.DeserializeFromJson(request.Json);
                composition.CreatedAt = DateTime.UtcNow;
                composition.UpdatedAt = DateTime.UtcNow;

                var saved = await compositionService.ValidateAndSaveAsync(composition);

                logger.LogInformation("Imported composition {CompositionId} from JSON", saved.Id);

                return Results.Created($"/api/compositions/{saved.Id}", saved.ToResponse());
            }
            catch (InvalidOperationException exception)
            {
                return Results.BadRequest(new { error = exception.Message });
            }
        });

        return app;
    }
}
