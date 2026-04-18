using System.Security.Claims;
using KwintBaseHarmony.Data;
using KwintBaseHarmony.Models;
using Microsoft.EntityFrameworkCore;

namespace KwintBaseHarmony.Auth;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var auth = app.MapGroup("/api/auth");

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
            if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
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

        return app;
    }
}
