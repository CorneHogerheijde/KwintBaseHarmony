using System.Security.Claims;
using KwintBaseHarmony.Data;
using KwintBaseHarmony.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.MicrosoftAccount;
using Microsoft.EntityFrameworkCore;

namespace KwintBaseHarmony.Auth;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var auth = app.MapGroup("/api/auth");

        // Returns the list of OAuth providers currently registered (i.e. configured).
        // The frontend uses this to show only the buttons that are actually usable.
        auth.MapGet("/providers", async (IAuthenticationSchemeProvider schemeProvider) =>
        {
            var all = await schemeProvider.GetAllSchemesAsync();
            var knownOAuth = new Dictionary<string, string>
            {
                [GoogleDefaults.AuthenticationScheme]          = "google",
                [MicrosoftAccountDefaults.AuthenticationScheme] = "microsoft",
                ["LinkedIn"]                                    = "linkedin"
            };
            var available = all
                .Where(s => knownOAuth.ContainsKey(s.Name))
                .Select(s => knownOAuth[s.Name])
                .ToArray();
            return Results.Ok(available);
        }).AllowAnonymous();

        auth.MapPost("/register", async (
            RegisterRequest request,
            CompositionContext db,
            IConfiguration configuration) =>
        {
            var email = request.Email.Trim().ToLowerInvariant();

            if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
                return Results.BadRequest(new { error = "A valid email address is required." });

            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
                return Results.BadRequest(new { error = "Password must be at least 8 characters." });

            var existing = await db.Users.AnyAsync(u => u.Email == email);
            if (existing)
                return Results.Conflict(new { error = "An account with this email already exists." });

            var role = request.Role.Equals("Educator", StringComparison.OrdinalIgnoreCase)
                ? UserRole.Educator
                : UserRole.Student;

            var user = new User
            {
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = role
            };

            db.Users.Add(user);
            await db.SaveChangesAsync();

            var token = JwtService.GenerateToken(user, configuration);
            return Results.Ok(new AuthResponse(token, user.Id, user.Email, user.Role.ToString()));
        });

        auth.MapPost("/login", async (
            LoginRequest request,
            CompositionContext db,
            IConfiguration configuration) =>
        {
            var email = request.Email.Trim().ToLowerInvariant();

            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user is null || user.PasswordHash is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Results.Unauthorized();

            var token = JwtService.GenerateToken(user, configuration);
            return Results.Ok(new AuthResponse(token, user.Id, user.Email, user.Role.ToString()));
        });

        auth.MapGet("/me", (ClaimsPrincipal principal) =>
        {
            var userId = principal.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
            var email = principal.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)?.Value;
            var role = principal.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            if (userId is null || email is null)
                return Results.Unauthorized();

            return Results.Ok(new MeResponse(Guid.Parse(userId), email, role ?? "Student"));
        }).RequireAuthorization();

        // ── OAuth / Social login ──────────────────────────────────────────────
        // Initiates a social-login flow by issuing a Challenge for the requested
        // scheme. The middleware then redirects the browser to the provider.
        auth.MapGet("/oauth/{provider}", (string provider, HttpContext httpContext) =>
        {
            var scheme = provider.ToLowerInvariant() switch
            {
                "google"    => GoogleDefaults.AuthenticationScheme,
                "microsoft" => MicrosoftAccountDefaults.AuthenticationScheme,
                "linkedin"  => "LinkedIn",
                _           => null
            };

            if (scheme is null)
                return Results.BadRequest(new { error = $"Unknown provider '{provider}'." });

            // Only issue a challenge if the scheme was actually registered
            // (i.e. its credentials were configured). Avoids a 500 when the
            // provider is not yet set up.
            var schemeProvider = httpContext.RequestServices
                .GetRequiredService<Microsoft.AspNetCore.Authentication.IAuthenticationSchemeProvider>();
            var registered = schemeProvider.GetSchemeAsync(scheme).GetAwaiter().GetResult();
            if (registered is null)
                return Results.BadRequest(new { error = $"Provider '{provider}' is not configured on this server." });

            var props = new AuthenticationProperties
            {
                RedirectUri = $"/api/auth/oauth/{provider}/callback"
            };

            return Results.Challenge(props, new[] { scheme });
        }).AllowAnonymous();

        return app;
    }
}
