using System.Collections.Generic;
using KwintBaseHarmony.Infrastructure;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace KwintBaseHarmony.Tests;

public class HttpsRedirectionPolicyTests
{
    [Theory]
    [InlineData("http://localhost:5000", false)]
    [InlineData("http://localhost:5000;https://localhost:7049", true)]
    [InlineData("https://localhost:7049", true)]
    public void ShouldUseHttpsRedirection_ReturnsExpectedValue_ForConfiguredUrls(string urls, bool expected)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["urls"] = urls
            })
            .Build();

        var result = HttpsRedirectionPolicy.ShouldUseHttpsRedirection(configuration);

        Assert.Equal(expected, result);
    }

    [Fact]
    public void ShouldUseHttpsRedirection_ReturnsFalse_WhenNoUrlsConfigured()
    {
        var configuration = new ConfigurationBuilder().Build();

        var result = HttpsRedirectionPolicy.ShouldUseHttpsRedirection(configuration);

        Assert.False(result);
    }
}