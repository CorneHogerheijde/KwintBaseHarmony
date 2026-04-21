using System;
using System.Linq;
using System.Threading.Tasks;
using KwintBaseHarmony.Data;
using KwintBaseHarmony.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace KwintBaseHarmony.Tests.Services;

public class AnalysisServiceTests : IDisposable
{
    private readonly CompositionContext _context;
    private readonly CompositionService _compositionService;
    private readonly AnalysisService _analysisService;

    public AnalysisServiceTests()
    {
        var options = new DbContextOptionsBuilder<CompositionContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new CompositionContext(options);
        var logger = new Mock<ILogger<CompositionService>>().Object;
        _compositionService = new CompositionService(_context, logger);
        _analysisService = new AnalysisService(_compositionService);
    }

    public void Dispose() => _context.Dispose();

    // ── ParseChordChart ───────────────────────────────────────────────────────

    [Fact]
    public void ParseChordChart_DashSeparated_ReturnsCorrectCount()
    {
        var result = _analysisService.ParseChordChart("C - G - Am - F");
        Assert.Equal(4, result.Count);
    }

    [Fact]
    public void ParseChordChart_CommaSeparated_ReturnsCorrectCount()
    {
        var result = _analysisService.ParseChordChart("C, G, Am, F");
        Assert.Equal(4, result.Count);
    }

    [Fact]
    public void ParseChordChart_SpaceSeparated_ReturnsCorrectCount()
    {
        var result = _analysisService.ParseChordChart("C G Am F");
        Assert.Equal(4, result.Count);
    }

    [Theory]
    [InlineData("C",   60, "major",     false)]
    [InlineData("G",   67, "major",     false)]
    [InlineData("Am",  69, "minor",     true)]
    [InlineData("F",   65, "major",     false)]
    [InlineData("Dm",  62, "minor",     true)]
    [InlineData("G7",  67, "dominant7", false)]
    [InlineData("Fmaj7", 65, "major7",  false)]
    [InlineData("Am7", 69, "minor7",    true)]
    [InlineData("Bdim",71, "diminished",true)]
    [InlineData("Caug",60, "augmented", false)]
    public void ParseChordChart_SingleChord_ParsedCorrectly(
        string chart, int expectedMidi, string expectedQuality, bool expectedMinor)
    {
        var result = _analysisService.ParseChordChart(chart);

        Assert.Single(result);
        Assert.Equal(expectedMidi, result[0].RootMidi);
        Assert.Equal(expectedQuality, result[0].Quality);
        Assert.Equal(expectedMinor, result[0].IsMinor);
    }

    [Fact]
    public void ParseChordChart_EmptyString_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() => _analysisService.ParseChordChart("   "));
    }

    [Fact]
    public void ParseChordChart_NoRecognisableChords_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() => _analysisService.ParseChordChart("??? !!!"));
    }

    [Fact]
    public void ParseChordChart_FlatRoot_ParsedCorrectly()
    {
        var result = _analysisService.ParseChordChart("Bb");
        Assert.Single(result);
        Assert.Equal(70, result[0].RootMidi); // A#/Bb = 60 + 10
    }

    [Fact]
    public void ParseChordChart_SharpRoot_ParsedCorrectly()
    {
        var result = _analysisService.ParseChordChart("F#");
        Assert.Single(result);
        Assert.Equal(66, result[0].RootMidi); // F# = 60 + 6
    }

    // ── Explain ───────────────────────────────────────────────────────────────

    [Fact]
    public void Explain_I_V_vi_IV_ReturnsProgressionSummary()
    {
        var chords = _analysisService.ParseChordChart("C - G - Am - F");
        var explanation = _analysisService.Explain(chords);

        Assert.Contains("I–V–vi–IV", explanation);
    }

    [Fact]
    public void Explain_IncludesAllChordSymbols()
    {
        var chords = _analysisService.ParseChordChart("C - G - Am - F");
        var explanation = _analysisService.Explain(chords);

        Assert.Contains("C", explanation);
        Assert.Contains("G", explanation);
        Assert.Contains("Am", explanation);
        Assert.Contains("F", explanation);
    }

    [Fact]
    public void Explain_EmptyList_ReturnsNoChordMessage()
    {
        var result = _analysisService.Explain([]);
        Assert.Contains("No chords", result);
    }

    [Fact]
    public void Explain_TonicIdentified_AsHomeChord()
    {
        var chords = _analysisService.ParseChordChart("C");
        var explanation = _analysisService.Explain(chords);
        Assert.Contains("Tonic", explanation);
    }

    // ── CreateFromChordChartAsync ─────────────────────────────────────────────

    [Fact]
    public async Task CreateFromChordChartAsync_SetsRootMidiFromFirstChord()
    {
        var chords = _analysisService.ParseChordChart("G - D - Em - C");
        var composition = await _analysisService.CreateFromChordChartAsync("student-1", "G major song", chords);

        Assert.Equal(67, composition.RootMidi); // G4
    }

    [Fact]
    public async Task CreateFromChordChartAsync_ReturnsCompositionWithSevenLayers()
    {
        var chords = _analysisService.ParseChordChart("C - G - Am - F");
        var composition = await _analysisService.CreateFromChordChartAsync("student-1", "Test Song", chords);

        Assert.Equal(7, composition.Layers.Count);
    }

    [Fact]
    public async Task CreateFromChordChartAsync_LayersHavePresetNotes()
    {
        var chords = _analysisService.ParseChordChart("C - G - Am - F");
        var composition = await _analysisService.CreateFromChordChartAsync("student-1", "Test Song", chords);

        var layersWithNotes = composition.Layers.Count(l => l.Notes.Count > 0);
        Assert.True(layersWithNotes > 0, "At least one layer should have a pre-set note");
    }

    [Fact]
    public async Task CreateFromChordChartAsync_EmptyChords_ThrowsArgumentException()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _analysisService.CreateFromChordChartAsync("student-1", "Title", []));
    }
}
