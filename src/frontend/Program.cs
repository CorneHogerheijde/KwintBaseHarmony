var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// Serve runtime configuration so JS can read the backend URL without a rebuild.
// Set the API_BASE_URL environment variable in Azure to point at the backend Container App.
app.MapGet("/app-config.js", (IConfiguration config) =>
{
    var apiBase = config["API_BASE_URL"] ?? "http://localhost:5000";
    var js = $"window.APP_CONFIG = {{ apiBase: \"{apiBase}\" }};";
    return Results.Content(js, "application/javascript");
});

app.Run();