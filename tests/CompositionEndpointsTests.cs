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
    public async Task CompleteLayer_WithAnalytics_PersistsTimeAndPuzzleAnswers()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-analytics-01",
            title = "Analytics Test",
            difficulty = "beginner"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(created);

        var completeResponse = await client.PostAsJsonAsync(
            $"/api/compositions/{created.Id}/layers/1/complete",
            new { attempts = 3, firstTryCorrect = false, timeSpentMs = 42000 });

        Assert.Equal(HttpStatusCode.OK, completeResponse.StatusCode);

        var result = await completeResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(result);
        var layer = result.Layers[0];
        Assert.True(layer.Completed);
        Assert.Equal(42000, layer.TimeSpentMs);
        Assert.NotNull(layer.PuzzleAnswersJson);
        var analytics = JsonSerializer.Deserialize<JsonElement>(layer.PuzzleAnswersJson!);
        Assert.Equal(3, analytics.GetProperty("attempts").GetInt32());
        Assert.False(analytics.GetProperty("firstTryCorrect").GetBoolean());
    }

    [Fact]
    public async Task CompleteLayer_WithoutBody_ZerosAnalytics()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-analytics-02",
            title = "Skip Layer Test",
            difficulty = "beginner"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(created);

        var completeResponse = await client.PostAsync(
            $"/api/compositions/{created.Id}/layers/1/complete", content: null);

        Assert.Equal(HttpStatusCode.OK, completeResponse.StatusCode);

        var result = await completeResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(result);
        var layer = result.Layers[0];
        Assert.True(layer.Completed);
        Assert.Equal(0, layer.TimeSpentMs);
        Assert.Null(layer.PuzzleAnswersJson);
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

    [Fact]
    public async Task GetAnalytics_WithUnknownId_ReturnsNotFound()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync($"/api/compositions/{Guid.NewGuid()}/analytics");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetAnalytics_ForFreshComposition_ReturnsZeroTotals()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-analytics-10",
            title = "Fresh Analytics",
            difficulty = "intermediate"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(created);

        var analyticsResponse = await client.GetAsync($"/api/compositions/{created.Id}/analytics");

        Assert.Equal(HttpStatusCode.OK, analyticsResponse.StatusCode);

        var analytics = await analyticsResponse.Content.ReadFromJsonAsync<CompositionAnalyticsResponseDto>();
        Assert.NotNull(analytics);
        Assert.Equal(created.Id, analytics.CompositionId);
        Assert.Equal("intermediate", analytics.Difficulty);
        Assert.Equal(0, analytics.Summary.CompletedLayers);
        Assert.Equal(7, analytics.Summary.TotalLayers);
        Assert.Equal(0L, analytics.Summary.TotalTimeSpentMs);
        Assert.Null(analytics.Summary.AverageAttemptsPerLayer);
        Assert.Null(analytics.Summary.FirstTryCorrectRate);
        Assert.Equal(7, analytics.Layers.Count);
        Assert.All(analytics.Layers, layer =>
        {
            Assert.False(layer.Completed);
            Assert.Null(layer.Attempts);
            Assert.Null(layer.FirstTryCorrect);
        });
    }

    [Fact]
    public async Task GetAnalytics_AfterCompletingLayersWithAnalytics_ReturnsAggregatedSummary()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-analytics-11",
            title = "Aggregated Analytics",
            difficulty = "beginner"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(created);

        // Complete layer 1: 3 attempts, not first-try, 30 000 ms
        await client.PostAsJsonAsync(
            $"/api/compositions/{created.Id}/layers/1/complete",
            new { attempts = 3, firstTryCorrect = false, timeSpentMs = 30000 });

        // Complete layer 2: 1 attempt, first-try, 10 000 ms
        await client.PostAsJsonAsync(
            $"/api/compositions/{created.Id}/layers/2/complete",
            new { attempts = 1, firstTryCorrect = true, timeSpentMs = 10000 });

        var analyticsResponse = await client.GetAsync($"/api/compositions/{created.Id}/analytics");

        Assert.Equal(HttpStatusCode.OK, analyticsResponse.StatusCode);

        var analytics = await analyticsResponse.Content.ReadFromJsonAsync<CompositionAnalyticsResponseDto>();
        Assert.NotNull(analytics);
        Assert.Equal(2, analytics.Summary.CompletedLayers);
        Assert.Equal(40000L, analytics.Summary.TotalTimeSpentMs);
        Assert.Equal(2.0, analytics.Summary.AverageAttemptsPerLayer); // (3 + 1) / 2
        Assert.Equal(0.5, analytics.Summary.FirstTryCorrectRate);     // 1 of 2

        var layer1 = analytics.Layers.Single(l => l.LayerNumber == 1);
        Assert.True(layer1.Completed);
        Assert.Equal(3, layer1.Attempts);
        Assert.False(layer1.FirstTryCorrect);
        Assert.Equal(30000L, layer1.TimeSpentMs);

        var layer2 = analytics.Layers.Single(l => l.LayerNumber == 2);
        Assert.True(layer2.Completed);
        Assert.Equal(1, layer2.Attempts);
        Assert.True(layer2.FirstTryCorrect);
    }

    [Fact]
    public async Task CreateNextMovement_WhenParentComplete_Returns201WithMovement2()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        // Create and complete all 7 layers of movement 1
        var createResponse = await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-mv-1",
            title = "Movement Test",
            difficulty = "beginner"
        });
        var parent = await createResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(parent);

        for (var layer = 1; layer <= 7; layer++)
        {
            await client.PostAsJsonAsync($"/api/compositions/{parent.Id}/layers/{layer}/complete", new { });
        }

        var response = await client.PostAsJsonAsync($"/api/compositions/{parent.Id}/movements", new { });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var next = await response.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(next);
        Assert.Equal(2, next.MovementNumber);
        Assert.Equal(parent.Id, next.ParentCompositionId);
    }

    [Fact]
    public async Task CreateNextMovement_WhenParentIncomplete_Returns409()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-mv-2",
            title = "Incomplete Movement",
            difficulty = "beginner"
        });
        var parent = await createResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(parent);

        // Only complete 3 of 7 layers
        for (var layer = 1; layer <= 3; layer++)
        {
            await client.PostAsJsonAsync($"/api/compositions/{parent.Id}/layers/{layer}/complete", new { });
        }

        var response = await client.PostAsJsonAsync($"/api/compositions/{parent.Id}/movements", new { });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task GetMovementChain_Returns_AllMovementsInChain()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        // Create and complete movement 1
        var createResponse = await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-mv-3",
            title = "Chain Test",
            difficulty = "beginner"
        });
        var movement1 = await createResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(movement1);

        for (var layer = 1; layer <= 7; layer++)
        {
            await client.PostAsJsonAsync($"/api/compositions/{movement1.Id}/layers/{layer}/complete", new { });
        }

        var mvResp = await client.PostAsJsonAsync($"/api/compositions/{movement1.Id}/movements", new { });
        Assert.Equal(HttpStatusCode.Created, mvResp.StatusCode);

        var chainResponse = await client.GetAsync($"/api/compositions/{movement1.Id}/movements");
        Assert.Equal(HttpStatusCode.OK, chainResponse.StatusCode);

        var chain = await chainResponse.Content.ReadFromJsonAsync<List<CompositionResponseDto>>();
        Assert.NotNull(chain);
        Assert.Equal(2, chain.Count);
        Assert.Equal(1, chain[0].MovementNumber);
        Assert.Equal(2, chain[1].MovementNumber);
    }

    [Fact]
    public async Task CompositionResponse_IncludesMovementNumber()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "student-mv-4",
            title = "Movement Number Check",
            difficulty = "beginner"
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var comp = await createResponse.Content.ReadFromJsonAsync<CompositionResponseDto>();
        Assert.NotNull(comp);
        Assert.Equal(1, comp.MovementNumber);
        Assert.Null(comp.ParentCompositionId);
    }

    private sealed record CompositionResponseDto(Guid Id, string StudentId, string Title, string Difficulty, decimal CompletionPercentage, DateTime CreatedAt, DateTime UpdatedAt, List<LayerResponseDto> Layers, int MovementNumber = 1, Guid? ParentCompositionId = null);

    private sealed record LayerResponseDto(int LayerNumber, string Name, string? Concept, bool Completed, long TimeSpentMs, string? UserNotes, string? PuzzleAnswersJson, List<NoteResponseDto> Notes);

    private sealed record NoteResponseDto(int Pitch, int DurationMs, int TimingMs, int Velocity, DateTime CreatedAt);

    private sealed record CompositionAnalyticsResponseDto(Guid CompositionId, string Difficulty, decimal CompletionPercentage, AnalyticsSummaryDto Summary, List<LayerAnalyticsDto> Layers);

    private sealed record AnalyticsSummaryDto(int CompletedLayers, int TotalLayers, long TotalTimeSpentMs, double? AverageAttemptsPerLayer, double? FirstTryCorrectRate);

    private sealed record LayerAnalyticsDto(int LayerNumber, string Name, bool Completed, long TimeSpentMs, int? Attempts, bool? FirstTryCorrect);
}