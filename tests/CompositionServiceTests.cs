using System;
using System.Threading.Tasks;
using System.Linq;
using System.Text.Json;
using KwintBaseHarmony.Models;
using KwintBaseHarmony.Services;
using KwintBaseHarmony.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Moq;
using Microsoft.Extensions.Logging;

namespace KwintBaseHarmony.Tests.Services;

public class CompositionServiceTests : IDisposable
{
    private readonly CompositionContext _context;
    private readonly CompositionService _service;
    private readonly Mock<ILogger<CompositionService>> _mockLogger;

    public CompositionServiceTests()
    {
        // Use in-memory SQLite for testing
        var options = new DbContextOptionsBuilder<CompositionContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new CompositionContext(options);
        _mockLogger = new Mock<ILogger<CompositionService>>();
        _service = new CompositionService(_context, _mockLogger.Object);
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    [Fact]
    public async Task CreateAsync_InitializesSevenLayers()
    {
        // Act
        var composition = await _service.CreateAsync("student-123", "Test Composition", "beginner");

        // Assert
        Assert.NotEqual(Guid.Empty, composition.Id);
        Assert.Equal("student-123", composition.StudentId);
        Assert.Equal("Test Composition", composition.Title);
        Assert.Equal("beginner", composition.Difficulty);
        Assert.Equal(7, composition.Layers.Count);
        
        for (int i = 1; i <= 7; i++)
        {
            var layer = composition.Layers.FirstOrDefault(l => l.LayerNumber == i);
            Assert.NotNull(layer);
            Assert.False(layer.Completed);
            Assert.Empty(layer.Notes);
        }
    }

    [Fact]
    public async Task AddNoteToLayerAsync_AddsNoteSuccessfully()
    {
        // Arrange
        var composition = await _service.CreateAsync("student-123", "Test", "beginner");
        var note = new Note { Pitch = 60, DurationMs = 500, TimingMs = 0, Velocity = 100 };

        // Act
        var result = await _service.AddNoteToLayerAsync(composition.Id, 1, note);

        // Assert
        var layer = result.Layers.First(l => l.LayerNumber == 1);
        Assert.Single(layer.Notes);
        Assert.Equal(60, layer.Notes.First().Pitch);
    }

    [Fact]
    public async Task SerializeToJson_ProducesValidJson()
    {
        // Arrange
        var composition = await _service.CreateAsync("student-123", "Test", "beginner");
        var note = new Note { Pitch = 60, DurationMs = 500, TimingMs = 0 };
        await _service.AddNoteToLayerAsync(composition.Id, 1, note);

        // Act
        var json = _service.SerializeToJson(composition);

        // Assert
        Assert.NotEmpty(json);
        var deserialized = JsonSerializer.Deserialize<JsonElement>(json);
        Assert.NotEqual(default, deserialized);
        Assert.True(deserialized.TryGetProperty("studentId", out _));
        Assert.True(deserialized.TryGetProperty("layers", out var layers));
        Assert.True(layers.GetArrayLength() > 0);
    }

    [Fact]
    public async Task RoundtripSerializationPreservesData()
    {
        // Arrange
        var composition = await _service.CreateAsync("student-123", "Test", "beginner");
        var note1 = new Note { Pitch = 60, DurationMs = 500, TimingMs = 0, Velocity = 100 };
        var note2 = new Note { Pitch = 67, DurationMs = 500, TimingMs = 0, Velocity = 95 };

        await _service.AddNoteToLayerAsync(composition.Id, 1, note1);
        await _service.AddNoteToLayerAsync(composition.Id, 1, note2);

        var originalJson = _service.SerializeToJson(composition);

        // Act
        var deserializedComposition = _service.DeserializeFromJson(originalJson);

        // Assert
        Assert.Equal(composition.StudentId, deserializedComposition.StudentId);
        Assert.Equal(composition.Title, deserializedComposition.Title);
        Assert.Equal(7, deserializedComposition.Layers.Count);

        var layer1 = deserializedComposition.Layers.First(l => l.LayerNumber == 1);
        Assert.Equal(2, layer1.Notes.Count);
        Assert.Contains(layer1.Notes, n => n.Pitch == 60);
        Assert.Contains(layer1.Notes, n => n.Pitch == 67);
    }

    [Fact]
    public async Task CompleteLayerAsync_UpdatesCompletionPercentage()
    {
        // Arrange
        var composition = await _service.CreateAsync("student-123", "Test", "beginner");
        Assert.Equal(0, composition.CompletionPercentage);

        // Act - complete layer 1 (no analytics)
        var result = await _service.CompleteLayerAsync(composition.Id, 1, null, null, null);

        // Assert
        Assert.True(result.Layers.First(l => l.LayerNumber == 1).Completed);
        decimal expected = Math.Round((1m / 7m) * 100, 1); // 14.3%
        Assert.Equal(expected, result.CompletionPercentage);
    }

    [Fact]
    public async Task ValidateLayers_ThrowsIfLessThanFiveLayers()
    {
        // Arrange
        var composition = await _service.CreateAsync("student-123", "Test", "beginner");
        
        // Remove 3 layers to make it invalid
        var layersToRemove = composition.Layers.OrderByDescending(l => l.LayerNumber).Take(3).ToList();
        foreach (var layer in layersToRemove)
        {
            composition.Layers.Remove(layer);
        }

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => composition.ValidateLayers());
    }

    [Fact]
    public async Task GetByIdAsync_RetrievesCompositionWithAllData()
    {
        // Arrange
        var composition = await _service.CreateAsync("student-123", "Test", "beginner");
        var note = new Note { Pitch = 60, DurationMs = 500, TimingMs = 0 };
        await _service.AddNoteToLayerAsync(composition.Id, 1, note);

        // Act
        var retrieved = await _service.GetByIdAsync(composition.Id);

        // Assert
        Assert.NotNull(retrieved);
        Assert.Equal(composition.Id, retrieved.Id);
        Assert.Equal(7, retrieved.Layers.Count);
        var layer = retrieved.Layers.First(l => l.LayerNumber == 1);
        Assert.Single(layer.Notes);
    }

    [Fact]
    public async Task GetByStudentIdAsync_ReturnsAllStudentCompositions()
    {
        // Arrange
        await _service.CreateAsync("student-123", "Comp 1", "beginner");
        await _service.CreateAsync("student-123", "Comp 2", "intermediate");
        await _service.CreateAsync("student-456", "Comp 3", "beginner");

        // Act
        var result = await _service.GetByStudentIdAsync("student-123");

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, c => Assert.Equal("student-123", c.StudentId));
    }

    [Fact]
    public async Task DeleteAsync_RemovesCompositionAndRelatedData()
    {
        // Arrange
        var composition = await _service.CreateAsync("student-123", "Test", "beginner");
        var note = new Note { Pitch = 60, DurationMs = 500, TimingMs = 0 };
        await _service.AddNoteToLayerAsync(composition.Id, 1, note);

        // Act
        var deleted = await _service.DeleteAsync(composition.Id);

        // Assert
        Assert.True(deleted);
        var retrieved = await _service.GetByIdAsync(composition.Id);
        Assert.Null(retrieved);
    }
}
