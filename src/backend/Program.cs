using Dapr.Client;
using Dapr.Workflow;

var builder = WebApplication.CreateBuilder(args);

// Add Dapr client
builder.Services.AddDaprClient();

// Add Dapr Workflow
builder.Services.AddDaprWorkflow(options =>
{
    // Register workflows and activities here
    // options.RegisterWorkflow<PuzzleWorkflow>();
});

// Add controllers
builder.Services.AddControllers();

// Add CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();
app.UseAuthorization();

// Map Dapr pub/sub endpoints
app.MapSubscribeHandler();

// Map controllers
app.MapControllers();

app.Run();
