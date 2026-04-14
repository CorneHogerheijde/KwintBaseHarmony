using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace KwintBaseHarmony.Infrastructure;

public static class HttpsRedirectionPolicy
{
    public static bool ShouldUseHttpsRedirection(IConfiguration configuration)
    {
        var configuredUrls = configuration[WebHostDefaults.ServerUrlsKey]
            ?? configuration["ASPNETCORE_URLS"]
            ?? string.Empty;

        return configuredUrls
            .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Any(url => url.StartsWith("https://", StringComparison.OrdinalIgnoreCase));
    }
}