using System.Security.Claims;
using KwintBaseHarmony.Data;
using KwintBaseHarmony.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;

namespace KwintBaseHarmony.Auth;

/// <summary>
/// Handles the OAuth ticket-received event for all social providers.
/// Finds or creates a local User account, generates a JWT, and
/// redirects the browser to the frontend with the token.
/// </summary>
public static class OAuthCallbackHandler
{
    public static async Task HandleTicketReceivedAsync(TicketReceivedContext context)
    {
        var principal = context.Principal;

        // Prefer the standard OIDC claim names; fall back to OpenID name-identifier.
        var email = principal?.FindFirst(ClaimTypes.Email)?.Value
                    ?? principal?.FindFirst("email")?.Value;

        var providerKey = principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                          ?? principal?.FindFirst("sub")?.Value;

        var provider = context.Scheme.Name.ToLowerInvariant();

        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(providerKey))
        {
            context.Response.Redirect("/login.html?error=oauth_no_email");
            context.HandleResponse();
            return;
        }

        var db = context.HttpContext.RequestServices.GetRequiredService<CompositionContext>();
        var configuration = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();

        // 1. Try to find by (provider, providerKey) first — exact match.
        var user = await db.Users.FirstOrDefaultAsync(u =>
            u.ExternalProvider == provider && u.ExternalProviderId == providerKey);

        // 2. Fall back to finding by email so we can link an existing local account.
        if (user is null)
        {
            user = await db.Users.FirstOrDefaultAsync(u =>
                u.Email == email.ToLowerInvariant());
        }

        if (user is null)
        {
            // 3. Brand-new user — create a local record without a password.
            user = new User
            {
                Email = email.ToLowerInvariant(),
                PasswordHash = null,
                ExternalProvider = provider,
                ExternalProviderId = providerKey,
                Role = UserRole.Student
            };
            db.Users.Add(user);
        }
        else if (user.ExternalProvider is null)
        {
            // 4. Existing email-only account: link it to this external provider.
            user.ExternalProvider = provider;
            user.ExternalProviderId = providerKey;
        }

        await db.SaveChangesAsync();

        var token = JwtService.GenerateToken(user, configuration);

        var redirectUrl = string.Concat(
            "/login.html",
            "?token=", Uri.EscapeDataString(token),
            "&userId=", user.Id,
            "&email=", Uri.EscapeDataString(user.Email),
            "&role=", user.Role.ToString());

        context.Response.Redirect(redirectUrl);
        context.HandleResponse();
    }
}
