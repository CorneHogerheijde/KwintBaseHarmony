using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;

namespace KwintBaseHarmony.Tests.Infrastructure;

/// <summary>
/// A test-only authentication handler that auto-authenticates every request with a
/// fixed test user. Swapped in by CustomWebApplicationFactory so existing integration
/// tests remain green after RequireAuthorization() was added to the API.
/// </summary>
public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "TestAuth";
    public const string TestUserId = "00000000-0000-0000-0000-000000000001";
    public const string TestUserEmail = "test@example.com";
    public const string TestUserRole = "Student";

    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder) { }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, TestUserId),
            new Claim(JwtRegisteredClaimNames.Email, TestUserEmail),
            new Claim(ClaimTypes.Role, TestUserRole),
        };
        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
