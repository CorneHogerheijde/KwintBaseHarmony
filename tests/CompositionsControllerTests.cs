using KwintBaseHarmony.Controllers;
using KwintBaseHarmony.Models;
using KwintBaseHarmony.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace KwintBaseHarmony.Tests.Controllers;

public class CompositionsControllerTests
{
    private readonly Mock<ICompositionService> _mockCompositionService;
    private readonly Mock<IMidiExportService> _mockMidiExportService;
    private readonly Mock<ILogger<CompositionsController>> _mockLogger;
    private readonly CompositionsController _controller;

    public CompositionsControllerTests()
    {
        _mockCompositionService = new Mock<ICompositionService>();
        _mockMidiExportService = new Mock<IMidiExportService>();
        _mockLogger = new Mock<ILogger<CompositionsController>>();
        _controller = new CompositionsController(
            _mockCompositionService.Object,
            _mockMidiExportService.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task CreateComposition_WithValidRequest_ReturnsCreatedAtAction()
    {
        // Arrange
        var request = new CreateCompositionRequest
        {
            StudentId = "student-001",
            Title = "My Harmony",
            Difficulty = "beginner"
        };

        var composition = new Composition
        {
            Id = Guid.NewGuid(),
            StudentId = "student-001",
            Title = "My Harmony",
            Difficulty = "beginner",
            CompletionPercentage = 0,
            CreatedAt = DateTime.UtcNow
        };

        _mockCompositionService
            .Setup(s => s.CreateAsync("student-001", "My Harmony", "beginner"))
            .ReturnsAsync(composition);

        // Act
        var result = await _controller.CreateComposition(request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(_controller.GetComposition), createdResult.ActionName);
        Assert.Equal(composition.Id, ((CompositionResponse)createdResult.Value!).Id);
    }

    [Fact]
    public async Task CreateComposition_WithoutStudentId_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreateCompositionRequest
        {
            StudentId = "",
            Title = "My Harmony"
        };

        // Act
        var result = await _controller.CreateComposition(request);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetComposition_WithValidId_ReturnsOkWithComposition()
    {
        // Arrange
        var compositionId = Guid.NewGuid();
        var composition = new Composition
        {
            Id = compositionId,
            StudentId = "student-001",
            Title = "My Harmony",
            Difficulty = "beginner",
            CreatedAt = DateTime.UtcNow
        };

        _mockCompositionService
            .Setup(s => s.GetByIdAsync(compositionId))
            .ReturnsAsync(composition);

        // Act
        var result = await _controller.GetComposition(compositionId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<CompositionResponse>(okResult.Value);
        Assert.Equal(compositionId, response.Id);
    }

    [Fact]
    public async Task GetComposition_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var compositionId = Guid.NewGuid();
        _mockCompositionService
            .Setup(s => s.GetByIdAsync(compositionId))
            .ReturnsAsync((Composition?)null);

        // Act
        var result = await _controller.GetComposition(compositionId);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateComposition_WithValidData_ReturnsOkWithUpdated()
    {
        // Arrange
        var compositionId = Guid.NewGuid();
        var existingComposition = new Composition
        {
            Id = compositionId,
            StudentId = "student-001",
            Title = "Old Title",
            Difficulty = "beginner",
            CreatedAt = DateTime.UtcNow
        };

        var updateRequest = new UpdateCompositionRequest
        {
            Title = "New Title"
        };

        var updatedComposition = new Composition
        {
            Id = compositionId,
            StudentId = "student-001",
            Title = "New Title",
            Difficulty = "beginner",
            CreatedAt = existingComposition.CreatedAt
        };

        _mockCompositionService
            .Setup(s => s.GetByIdAsync(compositionId))
            .ReturnsAsync(existingComposition);

        _mockCompositionService
            .Setup(s => s.UpdateAsync(It.IsAny<Composition>()))
            .ReturnsAsync(updatedComposition);

        // Act
        var result = await _controller.UpdateComposition(compositionId, updateRequest);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<CompositionResponse>(okResult.Value);
        Assert.Equal("New Title", response.Title);
    }

    [Fact]
    public async Task DeleteComposition_WithValidId_ReturnsNoContent()
    {
        // Arrange
        var compositionId = Guid.NewGuid();
        _mockCompositionService
            .Setup(s => s.DeleteAsync(compositionId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteComposition(compositionId);

        // Assert
        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task AddNoteToLayer_WithValidData_ReturnsCreatedAtAction()
    {
        // Arrange
        var compositionId = Guid.NewGuid();
        var request = new AddNoteRequest
        {
            Pitch = 60,
            DurationMs = 500,
            TimingMs = 0,
            Velocity = 100
        };

        var composition = new Composition
        {
            Id = compositionId,
            StudentId = "student-001",
            Title = "My Harmony",
            CreatedAt = DateTime.UtcNow
        };

        _mockCompositionService
            .Setup(s => s.AddNoteToLayerAsync(compositionId, 1, It.IsAny<Note>()))
            .ReturnsAsync(composition);

        // Act
        var result = await _controller.AddNoteToLayer(compositionId, 1, request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(_controller.GetComposition), createdResult.ActionName);
    }

    [Fact]
    public async Task AddNoteToLayer_WithInvalidPitch_ReturnsBadRequest()
    {
        // Arrange
        var compositionId = Guid.NewGuid();
        var request = new AddNoteRequest
        {
            Pitch = 200, // Invalid: > 127
            DurationMs = 500
        };

        // Act
        var result = await _controller.AddNoteToLayer(compositionId, 1, request);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task CompleteLayer_WithValidData_ReturnsOk()
    {
        // Arrange
        var compositionId = Guid.NewGuid();
        var composition = new Composition
        {
            Id = compositionId,
            StudentId = "student-001",
            Title = "My Harmony",
            CompletionPercentage = 14.3m, // 1 layer completed
            CreatedAt = DateTime.UtcNow
        };

        _mockCompositionService
            .Setup(s => s.CompleteLayerAsync(compositionId, 1))
            .ReturnsAsync(composition);

        // Act
        var result = await _controller.CompleteLayer(compositionId, 1);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<CompositionResponse>(okResult.Value);
        Assert.Equal(14.3m, response.CompletionPercentage);
    }

    [Fact]
    public async Task ExportMidi_WithValidId_ReturnsFileResult()
    {
        // Arrange
        var compositionId = Guid.NewGuid();
        var composition = new Composition
        {
            Id = compositionId,
            StudentId = "student-001",
            Title = "My Harmony",
            CreatedAt = DateTime.UtcNow
        };

        var midiData = new byte[] { 0x4D, 0x54, 0x68, 0x64 }; // MIDI header

        _mockCompositionService
            .Setup(s => s.GetByIdAsync(compositionId))
            .ReturnsAsync(composition);

        _mockMidiExportService
            .Setup(s => s.CompositionToMidiAsync(composition))
            .ReturnsAsync(midiData);

        // Act
        var result = await _controller.ExportMidi(compositionId);

        // Assert
        var fileResult = Assert.IsType<FileContentResult>(result);
        Assert.Equal("audio/midi", fileResult.ContentType);
        Assert.Equal(midiData, fileResult.FileContents);
    }

    [Fact]
    public async Task ExportJson_WithValidId_ReturnsJsonString()
    {
        // Arrange
        var compositionId = Guid.NewGuid();
        var composition = new Composition
        {
            Id = compositionId,
            StudentId = "student-001",
            Title = "My Harmony",
            CreatedAt = DateTime.UtcNow
        };

        var jsonString = @"{""id"":""" + compositionId + @""",""title"":""My Harmony""}";

        _mockCompositionService
            .Setup(s => s.GetByIdAsync(compositionId))
            .ReturnsAsync(composition);

        _mockCompositionService
            .Setup(s => s.SerializeToJson(composition))
            .Returns(jsonString);

        // Act
        var result = await _controller.ExportJson(compositionId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task GetStudentCompositions_ReturnsListOfCompositions()
    {
        // Arrange
        var studentId = "student-001";
        var compositions = new List<Composition>
        {
            new Composition { Id = Guid.NewGuid(), StudentId = studentId, Title = "Harmony 1", CreatedAt = DateTime.UtcNow },
            new Composition { Id = Guid.NewGuid(), StudentId = studentId, Title = "Harmony 2", CreatedAt = DateTime.UtcNow }
        };

        _mockCompositionService
            .Setup(s => s.GetByStudentIdAsync(studentId))
            .ReturnsAsync(compositions);

        // Act
        var result = await _controller.GetStudentCompositions(studentId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var responses = Assert.IsAssignableFrom<List<CompositionResponse>>(okResult.Value);
        Assert.Equal(2, responses.Count);
    }
}
