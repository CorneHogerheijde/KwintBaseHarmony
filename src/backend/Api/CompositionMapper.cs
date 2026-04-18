using KwintBaseHarmony.Models;

namespace KwintBaseHarmony.Api;

public static class CompositionMapper
{
    public static CompositionResponse ToResponse(this Composition composition) =>
        new(
            composition.Id,
            composition.StudentId,
            composition.Title,
            composition.Difficulty,
            composition.Style,
            composition.CompletionPercentage,
            composition.CreatedAt,
            composition.UpdatedAt,
            composition.RootMidi,
            composition.MovementNumber,
            composition.ParentCompositionId,
            composition.Layers
                .OrderBy(layer => layer.LayerNumber)
                .Select(layer => new LayerResponse(
                    layer.LayerNumber,
                    layer.Name,
                    layer.Concept,
                    layer.Completed,
                    layer.TimeSpentMs,
                    layer.UserNotes,
                    layer.PuzzleAnswersJson,
                    layer.Notes
                        .OrderBy(note => note.TimingMs)
                        .Select(note => new NoteResponse(
                            note.Pitch,
                            note.DurationMs,
                            note.TimingMs,
                            note.Velocity,
                            note.CreatedAt))
                        .ToList()))
                .ToList());
}
