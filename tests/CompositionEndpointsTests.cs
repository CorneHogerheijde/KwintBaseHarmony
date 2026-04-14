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
    public async Task PostCompositions_WithInvalidDifficulty_ReturnsUnprocessableEntity()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-invalid",
            title = "Broken Difficulty",
            difficulty = "expert"
        });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
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
    public async Task CompleteLayer_UpdatesCompletionPercentage()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-006",
            title = "Layer Completion",
            difficulty = "beginner"
        });

        var created = await createResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(created);

        var completeResponse = await client.PostAsync($"/api/compositions/{created.Id}/layers/1/complete", content: null);

        Assert.Equal(HttpStatusCode.OK, completeResponse.StatusCode);

        var completed = await completeResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(completed);
        Assert.Equal(14.3m, completed.CompletionPercentage);
        Assert.True(completed.Layers[0].Completed);
    }

    [Fact]
    public async Task GetStudentCompositions_ReturnsCompositionsForRequestedStudent()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-007",
            title = "Student Piece A",
            difficulty = "beginner"
        });

        await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-007",
            title = "Student Piece B",
            difficulty = "advanced"
        });

        await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-other",
            title = "Other Student",
            difficulty = "beginner"
        });

        var response = await client.GetAsync("/api/compositions/student/student-007");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<List<CompositionResponseDto>>();
        Assert.NotNull(payload);
        Assert.Equal(2, payload.Count);
        Assert.All(payload, composition => Assert.Equal("student-007", composition.StudentId));
    }

    [Fact]
    public async Task PutComposition_WithInvalidDifficulty_ReturnsBadRequest()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-008",
            title = "Update Me",
            difficulty = "beginner"
        });

        var created = await createResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(created);

        var updateResponse = await client.PutAsJsonAsync($"/api/compositions/{created.Id}", new
        {
            title = "Still Update Me",
            difficulty = "legendary"
        });

        Assert.Equal(HttpStatusCode.BadRequest, updateResponse.StatusCode);
    }

    [Fact]
    public async Task DeleteComposition_RemovesComposition()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-009",
            title = "Delete Me",
            difficulty = "beginner"
        });

        var created = await createResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(created);

        var deleteResponse = await client.DeleteAsync($"/api/compositions/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await client.GetAsync($"/api/compositions/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
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
    public async Task ExportJson_ReturnsParseableCompositionJson()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-010",
            title = "Json Export",
            difficulty = "intermediate"
        });

        var created = await createResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(created);

        var exportResponse = await client.GetAsync($"/api/compositions/{created.Id}/export/json");

        Assert.Equal(HttpStatusCode.OK, exportResponse.StatusCode);

        var exportedJson = await exportResponse.Content.ReadFromJsonAsync<string>();
        Assert.False(string.IsNullOrWhiteSpace(exportedJson));

        using var document = JsonDocument.Parse(exportedJson);
        Assert.Equal(created.Id, document.RootElement.GetProperty("id").GetGuid());
        Assert.Equal("Json Export", document.RootElement.GetProperty("title").GetString());
    }

    [Fact]
    public async Task PutComposition_UpdatesTitleAndDifficulty()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-011",
            title = "Original Title",
            difficulty = "beginner"
        });

        var created = await createResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(created);

        var updateResponse = await client.PutAsJsonAsync($"/api/compositions/{created.Id}", new
        {
            title = "Updated Title",
            difficulty = "advanced"
        });

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var updated = await updateResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(updated);
        Assert.Equal("Updated Title", updated.Title);
        Assert.Equal("advanced", updated.Difficulty);
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