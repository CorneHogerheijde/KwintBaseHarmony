# KwintBaseHarmony — Project Context

> **LLM AI Rules**: This file is the single source of truth for AI coding assistants working on this codebase. Always read this before making changes. Respect naming conventions, file placement, and architectural decisions documented here.

---

## Project Purpose

KwintBaseHarmony is a music education web application. Students learn harmony by solving progressive note/chord puzzles that form real musical compositions. The approach is calm and intrinsically motivated — no gamification, no streaks.

**Target users**: Student musicians and music educators  
**Methodology**: Kwintessence pedagogy — build chords layer by layer starting from root → fifth → third → seventh → extensions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | .NET 10, ASP.NET Core Minimal APIs |
| Database | PostgreSQL via Npgsql.EntityFrameworkCore.PostgreSQL 10.0.1 |
| ORM | EF Core 10 with code-first migrations |
| State store | Dapr.AspNetCore 1.17.8 (Dapr workflow intentionally NOT used) |
| Frontend | Vanilla JS ES Modules (no framework) |
| Backend tests | xUnit, Moq, EF Core InMemory |
| Frontend tests | Vitest (unit), Cypress (E2E) |
| API docs | Swashbuckle/Swagger |
| Container | Docker + docker-compose |
| Infra | Azure Bicep (infra/) |

---

## Repository Structure

```
src/
  backend/           .NET 10 ASP.NET Core Minimal API
    Api/             Endpoint extensions + DTOs + mapper (NEW — refactored)
      CompositionDtos.cs       All request/response records
      CompositionMapper.cs     ToResponse() extension method on Composition
      CompositionEndpoints.cs  CRUD + root-midi endpoints
      LayerEndpoints.cs        Note + complete-layer endpoints
      AnalyticsEndpoints.cs    GET /analytics endpoint
      ExportEndpoints.cs       MIDI + JSON export/import endpoints
      MovementEndpoints.cs     Movement chain endpoints
    Data/            EF Core DbContext (CompositionContext)
    Infrastructure/  HttpsRedirectionPolicy
    Migrations/      4 EF Core migrations
    Models/          Entity classes (Composition, Layer, Note)
    Services/        Business logic interfaces + implementations
    Program.cs       Lean entry point (~87 lines) — DI, middleware, endpoint wiring

  frontend/          Blazor-hosted static web app (Kestrel server)
    wwwroot/
      home.html / home.js          Landing page — create + lookup compositions
      puzzle.html / puzzle.js      Main puzzle UI (548 lines)
      app.html / app.js            Dashboard
      progress.html / progress.js  Analytics dashboard
      status.html / status.js      Backend health status
      scripts/
        api.js                Shared fetch wrapper — CANONICAL API pattern
        dom.js                Shared DOM refs + APP_CONFIG base URL
        logging.js            setStatus() shared helper
        audio.js              Web Audio API note preview
        music.js              midiToLabel, normalizeMidi, LAYER_COUNT
        notation.js           SVG music notation rendering
        piano.js              Piano keyboard component
        playback.js           Layer/arpeggio audio playback
        circle-of-fifths.js   Circle of fifths diagram
        puzzle-engine.js      Logic functions (getPuzzleLayers imported from data file)
        puzzle-layers-data.js Layer definition tables for all styles/difficulties

tests/
  KwintBaseHarmony.Tests/    xUnit integration + unit tests (43 tests)
    CompositionEndpointsTests.cs
    CompositionServiceTests.cs
    HttpsRedirectionPolicyTests.cs
    MidiExportServiceTests.cs

infra/               Azure Bicep infrastructure
scripts/             Local Dapr startup scripts
```

---

## Domain Model

### Composition
```
Id (Guid), StudentId (string), Title, Difficulty, Style
CompletionPercentage (decimal 0-100), CreatedAt, UpdatedAt
RootMidi (int 0-127, default 60), MovementNumber (1-3)
ParentCompositionId (Guid? — null for movement 1)
Layers (List<Layer>)
```

**AllowedDifficultyValues**: `beginner`, `intermediate`, `advanced`  
**AllowedStyleValues**: `classical`, `jazz`, `blues`

### Layer
```
Id (Guid), LayerNumber (1-7), Name, Concept
Completed (bool), TimeSpentMs (long)
UserNotes, PuzzleAnswersJson (JSON blob: {attempts, firstTryCorrect})
Notes (List<Note>)
```

### Note
```
Id (Guid), Pitch (int), DurationMs, TimingMs, Velocity, CreatedAt
```

---

## API Surface

Base path: `/api/compositions`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create composition |
| GET | `/{id}` | Get by ID |
| GET | `/student/{studentId}` | Get all for student |
| PUT | `/{id}` | Update title/difficulty |
| DELETE | `/{id}` | Delete |
| PATCH | `/{id}/root-midi` | Update root MIDI note |
| POST | `/{id}/layers/{n}/notes` | Add note to layer |
| POST | `/{id}/layers/{n}/complete` | Mark layer complete |
| GET | `/{id}/analytics` | Layer analytics |
| GET | `/{id}/export/midi` | Download MIDI file |
| GET | `/{id}/export/json` | Download JSON |
| POST | `/import/json` | Import from JSON |
| POST | `/{id}/movements` | Create next movement (201/409) |
| GET | `/{id}/movements` | Get movement chain |
| GET | `/health` | Health check |

---

## Backend Conventions

### Endpoint Pattern
All endpoints live in `src/backend/Api/` as `IEndpointRouteBuilder` extension methods. Each file maps a `MapGroup("/api/compositions")` internally. `Program.cs` wires them all in one chain:
```csharp
app.MapCompositionEndpoints()
   .MapLayerEndpoints()
   .MapAnalyticsEndpoints()
   .MapExportEndpoints()
   .MapMovementEndpoints();
```

### DTOs
All request/response records are in `KwintBaseHarmony.Api` namespace, file `Api/CompositionDtos.cs`. Use `sealed record`.

### Mapping
`CompositionMapper.ToResponse(this Composition)` in `Api/CompositionMapper.cs` is the single mapping path from entity to DTO.

### Tests
`public partial class Program;` MUST remain at the bottom of `Program.cs` — required by `WebApplicationFactory<Program>`.  
The test environment is named `"Testing"` — EF migrations are skipped in this env.

---

## Frontend Conventions

### API Calls
**Always use `scripts/api.js`**. All page scripts import:
```js
import { request } from "./scripts/api.js";
```
`request(path, options)` prepends `apiBaseUrl` (= `APP_CONFIG.apiBase + /api/compositions`).  
Do NOT create local `fetch()` wrappers or `API_BASE` constants in page scripts.

### Module Loading
All `<script>` tags use `type="module"`. Relative imports work naturally.

### Puzzle Engine
- `scripts/puzzle-layers-data.js` — exports `getPuzzleLayers(difficulty, style)` + all layer data tables
- `scripts/puzzle-engine.js` — imports `getPuzzleLayers` from data file, exports: `isCorrectNote`, `isCorrectChord`, `transposeLayers`, `getFirstIncompleteLayer`, `getMultipleChoiceOptions`
- puzzle.js imports all engine functions from `./scripts/puzzle-engine.js` (unchanged)

### Puzzle Types by Movement
- Movement 1: note-select (single MIDI note on piano)
- Movement 2: chord-select (multiple MIDI notes simultaneously)
- Movement 3: multiple-choice (4 options, `getMultipleChoiceOptions`)

---

## Development Status

### Completed Phases
| Phase | Description |
|-------|-------------|
| Phase 1 | REST API + EF Core + PostgreSQL |
| Phase 2 | Vanilla JS frontend + piano keyboard |
| Phase 3 | MIDI export, JSON round-trip, analytics, transposition |
| Phase 3A | LAYER_COUNT constant, Vitest suite |
| Phase 3B | Root-note transposition |
| Phase 3C | Notation staff SVG rendering |
| Phase 3D | Circle of Fifths diagram |
| Phase 4A | Modular compositions (movements 1–3), multiple-choice puzzle |
| Phase 4B | Style presets (classical/jazz/blues) |
| Phase 4C | Progress & analytics dashboard (Chart.js) |
| Refactor | Program.cs split into Api/ folder; frontend unified on scripts/api.js; puzzle-engine data/logic split |

### Upcoming (Phase 5 — TBD)
AI-powered harmonic analysis — analysing existing songs, identifying chord progressions, and teaching students through guided deconstruction of real music.

---

## EF Core Migrations

| Migration | Description |
|-----------|-------------|
| 20260414000000_InitialCreate | Compositions, Layers, Notes tables |
| 20260416000000_AddRootMidi | RootMidi column on Composition |
| 20260417000000_AddMovements | MovementNumber + ParentCompositionId + self-FK |
| 20260417000001_AddStyle | Style column on Composition |

Migrations run automatically on startup (skipped in Testing env).

---

## Key Configuration

- `appsettings.json`: Connection string `DefaultConnection`, CORS `AllowedOrigins`
- `APP_CONFIG.apiBase`: Set in each HTML page's `<script>` block; defaults to `http://localhost:5000`
- Dapr sidecar: runs locally via `scripts/start-dapr-local.ps1`; not used in tests or prod routing

---

## Testing

```bash
# Backend (43 xUnit tests)
dotnet test tests/KwintBaseHarmony.Tests/KwintBaseHarmony.Tests.csproj -c Release

# Frontend unit (Vitest)
cd src/frontend && npx vitest run

# Frontend E2E (Cypress)
cd src/frontend && npx cypress run
```

All 43 backend tests pass as of the last refactor (0 warnings, 0 errors).
