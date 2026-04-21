using KwintBaseHarmony.Models;

namespace KwintBaseHarmony.Services;

public interface ICompositionService
{
    Task<Composition> CreateAsync(string studentId, string title, string difficulty, string style = "classical", Guid? userId = null, int rootMidi = 60);
    Task<Composition?> GetByIdAsync(Guid compositionId);
    Task<List<Composition>> GetByStudentIdAsync(string studentId);
    Task<List<Composition>> GetByUserIdAsync(Guid userId);
    Task<Composition> UpdateAsync(Composition composition);
    Task<bool> DeleteAsync(Guid compositionId);
    Task<Composition> AddNoteToLayerAsync(Guid compositionId, int layerNumber, Note note);
    Task<Composition> CompleteLayerAsync(Guid compositionId, int layerNumber, int? attempts, bool? firstTryCorrect, long? timeSpentMs);
    Task<Composition> ValidateAndSaveAsync(Composition composition);
    string SerializeToJson(Composition composition);
    Composition DeserializeFromJson(string json);
    Task<Composition> CreateNextMovementAsync(Guid parentCompositionId);
    Task<List<Composition>> GetMovementChainAsync(Guid compositionId);
}