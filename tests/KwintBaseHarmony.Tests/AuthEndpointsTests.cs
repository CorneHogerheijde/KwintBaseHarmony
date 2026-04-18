using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using KwintBaseHarmony.Tests.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using KwintBaseHarmony.Data;
using Xunit;

namespace KwintBaseHarmony.Tests;

/// <summary>
/// A factory that uses real JWT validation (no TestAuthHandler) so we can test
/// the full register → token → authenticated-call flow end-to-end.
/// </summary>
file class AuthWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"kwintbaseharmony-auth-tests-{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<CompositionContext>>();
            services.RemoveAll<CompositionContext>();
            services.RemoveAll<IDbContextOptionsConfiguration<CompositionContext>>();

            services.AddDbContext<CompositionContext>(options =>
                options.UseInMemoryDatabase(_databaseName));

            using var serviceProvider = services.BuildServiceProvider();
            using var scope = serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<CompositionContext>();
            dbContext.Database.EnsureCreated();
        });
    }
}

public class AuthEndpointsTests
{
    // ── Register ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_WithValidData_ReturnsTokenAndUserInfo()
    {
        using var factory = new AuthWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "alice@example.com",
            password = "securepassword1",
            role = "Student"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(string.IsNullOrEmpty(body.GetProperty("token").GetString()));
        Assert.Equal("alice@example.com", body.GetProperty("email").GetString());
        Assert.Equal("Student", body.GetProperty("role").GetString());
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsConflict()
    {
        using var factory = new AuthWebApplicationFactory();
        using var client = factory.CreateClient();

        var payload = new { email = "bob@example.com", password = "securepassword1", role = "Student" };
        await client.PostAsJsonAsync("/api/auth/register", payload);

        var second = await client.PostAsJsonAsync("/api/auth/register", payload);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Register_WithShortPassword_ReturnsBadRequest()
    {
        using var factory = new AuthWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "carol@example.com",
            password = "short",
            role = "Student"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_WithInvalidEmail_ReturnsBadRequest()
    {
        using var factory = new AuthWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "not-an-email",
            password = "securepassword1",
            role = "Student"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_WithCorrectCredentials_ReturnsToken()
    {
        using var factory = new AuthWebApplicationFactory();
        using var client = factory.CreateClient();

        await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "dave@example.com",
            password = "securepassword1",
            role = "Educator"
        });

        var login = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "dave@example.com",
            password = "securepassword1"
        });

        Assert.Equal(HttpStatusCode.OK, login.StatusCode);

        var body = await login.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(string.IsNullOrEmpty(body.GetProperty("token").GetString()));
        Assert.Equal("Educator", body.GetProperty("role").GetString());
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        using var factory = new AuthWebApplicationFactory();
        using var client = factory.CreateClient();

        await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "eve@example.com",
            password = "securepassword1",
            role = "Student"
        });

        var login = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "eve@example.com",
            password = "wrongpassword"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);
    }

    [Fact]
    public async Task Login_WithUnknownEmail_ReturnsUnauthorized()
    {
        using var factory = new AuthWebApplicationFactory();
        using var client = factory.CreateClient();

        var login = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "nobody@example.com",
            password = "securepassword1"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);
    }

    // ── /me ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Me_WithValidToken_ReturnsUserInfo()
    {
        using var factory = new AuthWebApplicationFactory();
        using var client = factory.CreateClient();

        var reg = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "frank@example.com",
            password = "securepassword1",
            role = "Student"
        });
        var regBody = await reg.Content.ReadFromJsonAsync<JsonElement>();
        var token = regBody.GetProperty("token").GetString()!;

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var me = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, me.StatusCode);

        var meBody = await me.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("frank@example.com", meBody.GetProperty("email").GetString());
    }

    [Fact]
    public async Task Me_WithoutToken_ReturnsUnauthorized()
    {
        using var factory = new AuthWebApplicationFactory();
        using var client = factory.CreateClient();

        var me = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, me.StatusCode);
    }

    // ── Compositions require auth ─────────────────────────────────────────────

    [Fact]
    public async Task Compositions_WithoutToken_ReturnsUnauthorized()
    {
        using var factory = new AuthWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/compositions", new
        {
            studentId = "nobody",
            title = "Unauthorised",
            difficulty = "beginner"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetMyCompositions_ReturnsOnlyOwnCompositions()
    {
        using var factory = new AuthWebApplicationFactory();
        using var client = factory.CreateClient();

        // Register two users
        var reg1 = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "user1@example.com",
            password = "securepassword1",
            role = "Student"
        });
        var reg2 = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "user2@example.com",
            password = "securepassword1",
            role = "Student"
        });

        var token1 = (await reg1.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("token").GetString()!;
        var token2 = (await reg2.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("token").GetString()!;

        // User1 creates a composition
        using var createReq = new HttpRequestMessage(HttpMethod.Post, "/api/compositions");
        createReq.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token1);
        createReq.Content = JsonContent.Create(new { studentId = "user1", title = "User1 Piece", difficulty = "beginner" });
        await client.SendAsync(createReq);

        // User2 fetches their compositions — should be empty
        using var listReq = new HttpRequestMessage(HttpMethod.Get, "/api/compositions");
        listReq.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token2);
        var listResponse = await client.SendAsync(listReq);

        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

        var list = await listResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, list.GetArrayLength());
    }
}
