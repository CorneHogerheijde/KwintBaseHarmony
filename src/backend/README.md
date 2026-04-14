# KwintBaseHarmony Backend

.NET 8 + Dapr backend for KwintBaseHarmony music harmony learning app.

## Setup

```bash
# Install .NET 8 SDK
# Install Dapr CLI: https://docs.dapr.io/getting-started/install-dapr-cli/

# Restore dependencies
dotnet restore

# Run with Dapr
dapr run --app-id kwintbaseharmony-api \
         --app-port 7000 \
         --resources-path ./components \
         -- dotnet run

# Or run without Dapr (for testing)
dotnet run
```

## Project Structure

```
Controllers/
├── PuzzleController.cs        # Puzzle endpoints
├── CompositionController.cs   # Composition endpoints
└── ...

Workflows/
├── PuzzleWorkflow.cs          # Dapr workflow for puzzles
├── CompositionWorkflow.cs     # Dapr workflow for compositions
└── ...

Models/
├── Puzzle.cs                  # Puzzle domain model
├── Note.cs                    # Note model
├── Composition.cs             # Composition model
└── ...

Services/
├── IAudioService.cs           # Audio processing
├── IHarmonyService.cs         # Harmony logic
└── ...

Components/
├── state.yaml                 # Dapr state store config
└── ...
```

## Key Dependencies

- **Dapr.AspNetCore** — Dapr integration
- **Dapr.Workflow** — Workflow orchestration
- **Entity Framework Core** — Data access
- **NAudio** — Audio processing
- **Swashbuckle** — Swagger/OpenAPI

## API Endpoints

### Puzzles
- `GET /api/puzzles` — Get available puzzles
- `POST /api/puzzles/{id}/validate` — Validate puzzle answer

### Compositions
- `POST /api/compositions` — Create new composition
- `GET /api/compositions/{id}` — Get composition
- `PUT /api/compositions/{id}/notes` — Add notes

### Workflows
- `POST /api/workflow/startPuzzle` — Start puzzle workflow
- `GET /api/workflow/status/{instanceId}` — Get workflow status

## Dapr Workflows

### PuzzleWorkflow
Orchestrates the puzzle-solving flow:
1. Load puzzle
2. Listen for user input (notes)
3. Validate against expected answer
4. Trigger audio/visual feedback
5. Progress to next puzzle

### CompositionWorkflow
Manages multi-layer composition:
1. Start with root + 5th
2. Collect layer-by-layer decisions
3. Persist composition state
4. Allow pause/resume

## Development

```bash
dotnet run
dotnet watch run          # Auto-reload on changes
dotnet test               # Run tests (when added)
```

## Database

Uses Entity Framework Core with SQL Server backend (or SQLite for local development).

Migration commands:
```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```
