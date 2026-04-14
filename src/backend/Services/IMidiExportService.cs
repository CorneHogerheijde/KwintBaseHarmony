using KwintBaseHarmony.Models;

namespace KwintBaseHarmony.Services;

public interface IMidiExportService
{
    Task<byte[]> CompositionToMidiAsync(Composition composition);
    Task SaveMidiToFileAsync(Composition composition, string filePath);
}