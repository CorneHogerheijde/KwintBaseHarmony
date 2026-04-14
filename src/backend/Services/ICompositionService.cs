using KwintBaseHarmony.Models;

namespace KwintBaseHarmony.Services;

public interface ICompositionService
{
    Task<Composition> CreateAsync(string studentId, string title, string difficulty);
    Task<Composition?> GetByIdAsync(Guid compositionId);
    Task<List<Composition>> GetByStudentIdAsync(string studentId);
    Task<Composition> UpdateAsync(Composition composition);
    Task<bool> DeleteAsync(Guid compositionId);
    Task<Composition> AddNoteToLayerAsync(Guid compositionId, int layerNumber, Note note);
    Task<Composition> CompleteLayerAsync(Guid compositionId, int layerNumber);
    Task<Composition> ValidateAndSaveAsync(Composition composition);
    string SerializeToJson(Composition composition);
    Composition DeserializeFromJson(string json);
}