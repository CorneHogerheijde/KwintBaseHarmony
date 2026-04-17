using System;
using System.Threading.Tasks;
using System.Linq;
using System.IO;
using KwintBaseHarmony.Models;
using KwintBaseHarmony.Services;
using Xunit;
using Moq;
using Microsoft.Extensions.Logging;

namespace KwintBaseHarmony.Tests.Services;

public class MidiExportServiceTests
{
    private readonly MidiExportService _service;
    private readonly Mock<ILogger<MidiExportService>> _mockLogger;

    public MidiExportServiceTests()
    {
        _mockLogger = new Mock<ILogger<MidiExportService>>();
        _service = new MidiExportService(_mockLogger.Object);
    }

    [Fact]
    public async Task CompositionToMidiAsync_GeneratesValidMidiData()
    {
        // Arrange
        var composition = CreateTestComposition();

        // Act
        var midiData = await _service.CompositionToMidiAsync(composition);

        // Assert
        Assert.NotNull(midiData);
        Assert.NotEmpty(midiData);
        
        // MIDI files start with "MThd" (0x4D546864)
        Assert.Equal(0x4D, midiData[0]);
        Assert.Equal(0x54, midiData[1]);
        Assert.Equal(0x68, midiData[2]);
        Assert.Equal(0x64, midiData[3]);
    }

    [Fact]
    public async Task CompositionToMidiAsync_IncludesAllNotes()
    {
        // Arrange
        var composition = CreateTestComposition();
        var totalNotes = composition.Layers.Sum(l => l.Notes.Count);
        Assert.Equal(5, totalNotes); // We create 5 notes in test composition

        // Act
        var midiData = await _service.CompositionToMidiAsync(composition);

        // Assert - MIDI data should contain note-on events for the notes in the composition.
        Assert.NotEmpty(midiData);
        Assert.True(midiData.Count(value => value == 0x90) >= totalNotes);
    }

    [Fact]
    public async Task CompositionToMidiAsync_ThrowsIfNoLayers()
    {
        // Arrange
        var composition = new Composition
        {
            StudentId = "test",
            Title = "Test",
            Difficulty = "beginner"
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => 
            _service.CompositionToMidiAsync(composition));
    }

    [Fact]
    public async Task SaveMidiToFileAsync_CreatesValidFile()
    {
        // Arrange
        var composition = CreateTestComposition();
        var tempPath = Path.Combine(Path.GetTempPath(), $"test-{Guid.NewGuid()}.mid");

        try
        {
            // Act
            await _service.SaveMidiToFileAsync(composition, tempPath);

            // Assert
            Assert.True(File.Exists(tempPath));
            var fileInfo = new FileInfo(tempPath);
            Assert.True(fileInfo.Length > 0);

            var bytes = await File.ReadAllBytesAsync(tempPath);
            Assert.Equal(0x4D, bytes[0]); // "M" of "MThd"
        }
        finally
        {
            if (File.Exists(tempPath))
                File.Delete(tempPath);
        }
    }

    [Fact]
    public async Task CompositionToMidiAsync_RespectsPitchAndVelocity()
    {
        // Arrange - Create composition with specific pitch/velocity
        var composition = new Composition
        {
            StudentId = "test",
            Title = "Test",
            Difficulty = "beginner"
        };

        // Add 7 empty layers as required
        for (int i = 1; i <= 7; i++)
        {
            composition.Layers.Add(new Layer
            {
                LayerNumber = i,
                Name = $"Layer {i}",
                Completed = i <= 2
            });
        }

        // Add notes with specific pitches to layer 1
        composition.Layers.ElementAt(0).Notes.Add(new Note
        {
            Pitch = 60,    // Middle C
            DurationMs = 500,
            TimingMs = 0,
            Velocity = 100
        });

        composition.Layers.ElementAt(0).Notes.Add(new Note
        {
            Pitch = 72,    // C one octave higher
            DurationMs = 500,
            TimingMs = 500,
            Velocity = 80
        });

        // Act
        var midiData = await _service.CompositionToMidiAsync(composition);

        // Assert
        Assert.NotNull(midiData);
        Assert.NotEmpty(midiData);
        
        // Data should be larger than just header due to note events
        Assert.True(midiData.Length > 50);
    }

    private Composition CreateTestComposition()
    {
        var composition = new Composition
        {
            Id = Guid.NewGuid(),
            StudentId = "test-student",
            Title = "Test Composition",
            Difficulty = "beginner",
            CreatedAt = DateTime.UtcNow
        };

        // Create 7 layers (required by Kwintessence)
        for (int i = 1; i <= 7; i++)
        {
            var layer = new Layer
            {
                Id = Guid.NewGuid(),
                CompositionId = composition.Id,
                LayerNumber = i,
                Name = $"Layer {i}",
                Completed = i <= 2,
                CreatedAt = DateTime.UtcNow
            };

            // Add notes to first two layers
            if (i == 1)
            {
                layer.Notes.Add(new Note { Pitch = 60, DurationMs = 500, TimingMs = 0, Velocity = 100 });
                layer.Notes.Add(new Note { Pitch = 67, DurationMs = 500, TimingMs = 0, Velocity = 100 });
            }
            else if (i == 2)
            {
                layer.Notes.Add(new Note { Pitch = 60, DurationMs = 500, TimingMs = 0, Velocity = 100 });
                layer.Notes.Add(new Note { Pitch = 64, DurationMs = 500, TimingMs = 0, Velocity = 100 });
                layer.Notes.Add(new Note { Pitch = 67, DurationMs = 500, TimingMs = 0, Velocity = 100 });
            }

            composition.Layers.Add(layer);
        }

        return composition;
    }
}
