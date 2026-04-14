using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using KwintBaseHarmony.Tests.Infrastructure;
using Xunit;

namespace KwintBaseHarmony.Tests;

public class CompositionEndpointsTests
{
    [Fact]
    public async Task PostCompositions_CreatesCompositionWithSevenLayers()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-001",
            title = "Minimal API Composition",
            difficulty = "beginner"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(payload);
        Assert.Equal("student-001", payload.StudentId);
        Assert.Equal(7, payload.Layers.Count);
    }

    [Fact]
    public async Task GetComposition_ReturnsCreatedComposition()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-002",
            title = "Fetch Me",
            difficulty = "intermediate"
        });

        var created = await createResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(created);

        var getResponse = await client.GetAsync($"/api/compositions/{created.Id}");

        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var fetched = await getResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(fetched);
        Assert.Equal(created.Id, fetched.Id);
        Assert.Equal("Fetch Me", fetched.Title);
    }

    [Fact]
    public async Task AddNoteToLayer_WithInvalidPitch_ReturnsBadRequest()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-003",
            title = "Bad Note",
            difficulty = "beginner"
        });

        var created = await createResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(created);

        var noteResponse = await client.PostAsJsonAsync($"/api/compositions/{created.Id}/layers/1/notes", new
        {
            pitch = 200,
            durationMs = 500,
            timingMs = 0,
            velocity = 100
        });

        Assert.Equal(HttpStatusCode.BadRequest, noteResponse.StatusCode);
    }

    [Fact]
    public async Task ExportMidi_ReturnsMidiFile()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-004",
            title = "Midi Export",
            difficulty = "beginner"
        });

        var created = await createResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(created);

        var midiResponse = await client.GetAsync($"/api/compositions/{created.Id}/export/midi");

        Assert.Equal(HttpStatusCode.OK, midiResponse.StatusCode);
        Assert.Equal("audio/midi", midiResponse.Content.Headers.ContentType?.MediaType);
        Assert.NotEmpty(await midiResponse.Content.ReadAsByteArrayAsync());
    }

    [Fact]
    public async Task ImportJson_PersistsCompositionFromPayload()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var compositionId = Guid.NewGuid();
        var payload = BuildImportPayload(compositionId, "Imported Composition");

        var response = await client.PostAsJsonAsync("/api/compositions/import/json", new
        {
            json = payload
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var imported = await response.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(imported);
        Assert.Equal("Imported Composition", imported.Title);
        Assert.Equal(7, imported.Layers.Count);
    }

    [Fact]
    public async Task ImportJson_ReplacesExistingCompositionAggregate()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var compositionId = Guid.NewGuid();
        var originalPayload = BuildImportPayload(compositionId, "Original Import");
        var originalResponse = await client.PostAsJsonAsync("/api/compositions/import/json", new
        {
            json = originalPayload
        });

        Assert.Equal(HttpStatusCode.Created, originalResponse.StatusCode);

        var updatedPayload = BuildImportPayload(
            compositionId,
            "Updated Import",
            includeFirstLayerNote: true,
            firstLayerCompleted: true);

        var updatedResponse = await client.PostAsJsonAsync("/api/compositions/import/json", new
        {
            json = updatedPayload
        });

        Assert.Equal(HttpStatusCode.Created, updatedResponse.StatusCode);

        var getResponse = await client.GetAsync($"/api/compositions/{compositionId}");

        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var imported = await getResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(imported);
        Assert.Equal("Updated Import", imported.Title);
        Assert.True(imported.Layers[0].Completed);
        Assert.Single(imported.Layers[0].Notes);
        Assert.Equal(60, imported.Layers[0].Notes[0].Pitch);
    }

    private static string BuildImportPayload(
        Guid compositionId,
        string title,
        bool includeFirstLayerNote = false,
        bool firstLayerCompleted = false)
    {
        return JsonSerializer.Serialize(new
        {
            id = compositionId,
            studentId = "student-005",
            title,
            difficulty = "advanced",
            completionPercentage = firstLayerCompleted ? 14.3m : 0m,
            createdAt = DateTime.UtcNow,
            updatedAt = DateTime.UtcNow,
            layers = Enumerable.Range(1, 7).Select(index => new
            {
                id = Guid.NewGuid(),
                compositionId,
                layerNumber = index,
                name = $"Layer {index}",
                concept = $"Concept {index}",
                completed = firstLayerCompleted && index == 1,
                timeSpentMs = 0,
                userNotes = (string?)null,
                puzzleAnswersJson = (string?)null,
                createdAt = DateTime.UtcNow,
                updatedAt = DateTime.UtcNow,
                notes = includeFirstLayerNote && index == 1
                    ? new[]
                    {
                        new
                        {
                            id = Guid.NewGuid(),
                            layerId = Guid.NewGuid(),
                            pitch = 60,
                            durationMs = 500,
                            timingMs = 0,
                            velocity = 100,
                            createdAt = DateTime.UtcNow
                        }
                    }
                    : Array.Empty<object>()
            }).ToArray()
        });
    }

    private sealed record CompositionResponseDto(Guid Id, string StudentId, string Title, string Difficulty, decimal CompletionPercentage, DateTime CreatedAt, DateTime UpdatedAt, List<LayerResponseDto> Layers);

    private sealed record LayerResponseDto(int LayerNumber, string Name, string? Concept, bool Completed, long TimeSpentMs, string? UserNotes, List<NoteResponseDto> Notes);

    private sealed record NoteResponseDto(int Pitch, int DurationMs, int TimingMs, int Velocity, DateTime CreatedAt);
}