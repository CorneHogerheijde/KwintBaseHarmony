using KwintBaseHarmony.Models;

namespace KwintBaseHarmony.Services;

public class MidiExportService : IMidiExportService
{
    private readonly ILogger<MidiExportService> _logger;

    // MIDI constants
    private const int DefaultBpm = 120;

    public MidiExportService(ILogger<MidiExportService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Placeholder MIDI export - generates valid MIDI header + end-of-track.
    /// Full implementation with note data scheduled for Phase 2.
    /// </summary>
    public async Task<byte[]> CompositionToMidiAsync(Composition composition)
    {
        if (!composition.Layers.Any())
            throw new InvalidOperationException("Cannot export composition with no layers");

        composition.ValidateLayers();

        // Minimal valid MIDI file: header + track header + end-of-track
        var midiData = new List<byte>();

        // MIDI Header Chunk
        midiData.AddRange(System.Text.Encoding.ASCII.GetBytes("MThd"));  // Chunk type
        midiData.AddRange(new byte[] { 0x00, 0x00, 0x00, 0x06 });         // Header length (6 bytes)
        midiData.AddRange(new byte[] { 0x00, 0x00 });                     // Format (0 = single track)
        midiData.AddRange(new byte[] { 0x00, 0x01 });                     // Number of tracks (1)
        midiData.AddRange(new byte[] { 0x01, 0xE0 });                     // Division (480 ticks per quarter)

        // MIDI Track Chunk
        midiData.AddRange(System.Text.Encoding.ASCII.GetBytes("MTrk"));   // Chunk type
        
        // Track data (placeholder: will be replaced with actual note events in Phase 2)
        var trackData = new List<byte>();
        
        // Set Tempo: 120 BPM = 500000 microseconds per beat
        trackData.Add(0x00);                                              // Delta time = 0
        trackData.AddRange(new byte[] { 0xFF, 0x51, 0x03 });             // Tempo meta event + length
        trackData.AddRange(new byte[] { 0x07, 0xA1, 0x20 });             // 500000 in 3 bytes

        // Program Change: Channel 0, Program 0 (Acoustic Grand Piano)
        trackData.Add(0x00);                                              // Delta time = 0
        trackData.AddRange(new byte[] { 0xC0, 0x00 });                   // Program change

        // Add placeholder note events from layers (scaled to 1000ms = 1 beat for simplicity)
        long currentTicks = 0;
        foreach (var layer in composition.Layers.OrderBy(l => l.LayerNumber))
        {
            foreach (var note in layer.Notes.OrderBy(n => n.TimingMs))
            {
                long noteTicks = (note.TimingMs / 500) * 480;  // Convert ms to ticks at 120 BPM
                long deltaTicks = noteTicks - currentTicks;

                // Note On
                trackData.AddRange(EncodeVariableLength(deltaTicks));
                trackData.Add((byte)(0x90 | 0x00));                       // Note On, Channel 0
                trackData.Add((byte)Math.Clamp(note.Pitch, 0, 127));     // Pitch
                trackData.Add((byte)Math.Clamp(note.Velocity, 0, 127));  // Velocity

                // Note Off (after duration)
                long offTicks = (note.DurationMs / 500) * 480;
                trackData.AddRange(EncodeVariableLength(offTicks));
                trackData.Add((byte)(0x80 | 0x00));                       // Note Off, Channel 0
                trackData.Add((byte)Math.Clamp(note.Pitch, 0, 127));     // Pitch
                trackData.Add(0x40);                                       // Velocity

                currentTicks = noteTicks + offTicks;
            }
        }

        // End of Track
        trackData.Add(0x00);                                              // Delta time = 0
        trackData.AddRange(new byte[] { 0xFF, 0x2F, 0x00 });             // End of Track meta event

        // Track length (big-endian 4-byte integer)
        midiData.AddRange(BitConverter.GetBytes((uint)trackData.Count).Reverse());
        midiData.AddRange(trackData);

        _logger.LogInformation(
            "Exported composition {CompositionId} to MIDI: {Bytes} bytes, {Layers} layers, {Notes} total notes (Phase 2: full note data)",
            composition.Id, midiData.Count, composition.Layers.Count,
            composition.Layers.Sum(l => l.Notes.Count));

        return await Task.FromResult(midiData.ToArray());
    }

    /// <summary>
    /// Exports a composition to a MIDI file on disk.
    /// </summary>
    public async Task SaveMidiToFileAsync(Composition composition, string filePath)
    {
        try
        {
            var midiData = await CompositionToMidiAsync(composition);
            await File.WriteAllBytesAsync(filePath, midiData);

            _logger.LogInformation(
                "Saved MIDI file for composition {CompositionId} to {FilePath}",
                composition.Id, filePath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to save MIDI file for composition {CompositionId} to {FilePath}",
                composition.Id, filePath);
            throw;
        }
    }

    /// <summary>
    /// Encodes a long value as a MIDI variable-length quantity.
    /// </summary>
    private static List<byte> EncodeVariableLength(long value)
    {
        var result = new List<byte>();
        var buffer = new List<byte>();

        buffer.Add((byte)(value & 0x7F));
        value >>= 7;

        while (value > 0)
        {
            buffer.Insert(0, (byte)((value & 0x7F) | 0x80));
            value >>= 7;
        }

        return buffer;
    }
}
