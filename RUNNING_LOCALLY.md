# Running KwintBaseHarmony Locally

This guide shows how to run the backend API and test it locally. **Currently, only the backend (WS1-1.3) is functional.**

## Prerequisites

- **.NET SDK 8.0+** [Download](https://dotnet.microsoft.com/download)
- **PostgreSQL 14+** (local install or Docker)
- **Git**

## Setup

### 1. PostgreSQL Database

**Option A: Docker (Recommended)**
```bash
# Add PostgreSQL to docker-compose.yml first, then:
docker-compose up -d postgres

# Verify it's running:
docker ps
```

**Option B: Local PostgreSQL**
1. Install PostgreSQL 14+ locally
2. Create a database:
   ```sql
   CREATE DATABASE kwintbaseharmony;
   ```
3. Ensure `postgres` user can connect with password `postgres` (or update `appsettings.json`)

### 2. Clone & Restore Dependencies

```bash
cd c:\Projects\bmad\KwintBaseHarmony

# Restore NuGet packages
dotnet restore
```

## Running the Backend

### Start the .NET API Server

```bash
cd src/backend

# Run with auto-migration (Development environment)
dotnet run

# Or with watch mode (auto-reload on file changes)
dotnet watch run
```

Expected output:
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:7049
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5000
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to stop.
```

The API is now available at:
- **HTTP**: `http://localhost:5000`
- **HTTPS**: `https://localhost:7049`
- **Swagger UI**: `http://localhost:5000/swagger` ← Use this to test endpoints!

### Database Auto-Migration

On first run in Development environment, the database schema is automatically created:
- `Compositions` table
- `Layers` table (with composite unique index)
- `Notes` table (with playback-order index)

## Testing the API

### Option 1: Swagger UI (Easiest)

1. Navigate to `http://localhost:5000/swagger`
2. Expand endpoints
3. Click "Try it out" on any endpoint
4. Execute and see responses

### Option 2: curl

**Create a new composition:**
```bash
curl -X POST "http://localhost:5000/api/compositions" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-001",
    "title": "My First Harmony",
    "difficulty": "beginner"
  }'

# Response example:
# {
#   "id": "550e8400-e29b-41d4-a716-446655440000",
#   "studentId": "student-001",
#   "title": "My First Harmony",
#   "difficulty": "beginner",
#   "completionPercentage": 0.0,
#   "createdAt": "2026-04-14T10:30:00Z",
#   "layers": [
#     {"layerNumber": 1, "name": "Root", "completed": false, ...},
#     ...
#   ]
# }
```

**Get composition by ID:**
```bash
COMP_ID="550e8400-e29b-41d4-a716-446655440000"
curl "http://localhost:5000/api/compositions/$COMP_ID"
```

**Add a note to layer 1:**
```bash
COMP_ID="550e8400-e29b-41d4-a716-446655440000"
curl -X POST "http://localhost:5000/api/compositions/$COMP_ID/layers/1/notes" \
  -H "Content-Type: application/json" \
  -d '{
    "pitch": 60,
    "durationMs": 500,
    "timingMs": 0,
    "velocity": 100
  }'
```

**Export composition to MIDI:**
```bash
COMP_ID="550e8400-e29b-41d4-a716-446655440000"
curl -X GET "http://localhost:5000/api/compositions/$COMP_ID/export/midi" \
  --output my-composition.mid

# Open my-composition.mid in any DAW (Ableton, GarageBand, etc.)
```

### Option 3: Postman

1. Import endpoints from `http://localhost:5000/swagger/v1/swagger.json`
2. Create collection with endpoints
3. Test CRUD operations

## Running Tests

### Unit Tests

```bash
cd tests

# Run all tests
dotnet test

# Run specific test file
dotnet test --filter "FullyQualifiedName~CompositionServiceTests"

# Run with verbose output
dotnet test -v n
```

**Note**: Tests use EF Core In-Memory provider, so no database connection needed.

### Expected Test Results

```
CompositionServiceTests:
  ✅ CreateAsync_InitializesSevenLayers
  ✅ RoundtripSerializationPreservesData
  ✅ AddNoteToLayerAsync_UpdatesTimestamps
  ✅ CompleteLayerAsync_UpdatesCompletionPercentage
  ✅ ValidateLayers_ThrowsIfLessThanFiveLayers
  ... (9 total)

MidiExportServiceTests:
  ✅ CompositionToMidiAsync_GeneratesValidMidiData
  ✅ SaveMidiToFileAsync_CreatesValidFile
  ✅ RespectsPitchAndVelocity
  ... (5 total)

Total: 14 tests passed
```

## Project Structure

```
src/backend/
├── Program.cs                    # Startup config (DbContext, services, CORS)
├── appsettings.json              # Connection string (PostgreSQL)
├── KwintBaseHarmony.csproj       # Project file with deps
├── Models/
│   ├── Composition.cs            # Root entity with 7-layer structure
│   ├── Layer.cs                  # Harmonic layer (1-7)
│   └── Note.cs                   # MIDI note (pitch 0-127)
├── Data/
│   ├── CompositionContext.cs     # EF Core DbContext
│   └── Migrations/               # Auto-generated schema
├── Services/
│   ├── CompositionService.cs     # CRUD + JSON serialization
│   └── MidiExportService.cs      # MIDI file generation
└── (Controllers/ - to be created in WS1-1.4)

tests/
├── CompositionServiceTests.cs    # 9 unit tests
├── MidiExportServiceTests.cs     # 5 unit tests
└── KwintBaseHarmony.Tests.csproj
```

## Troubleshooting

### "Cannot connect to database"

```
Error: unable to connect to server: connection refused
```

**Fix:**
- Ensure PostgreSQL is running: `docker ps` (Docker) or check Services (local install)
- Verify connection string in `appsettings.json`
- Default: `Host=localhost;Port=5432;Database=kwintbaseharmony;Username=postgres;Password=postgres`

### "Migration failed"

```
Error: Generation of the database script failed. Unknown version...
```

**Fix:**
- Delete existing database: `DROP DATABASE kwintbaseharmony;`
- Run dotnet again (auto-migration will recreate schema)

### Swagger not loading

```
HTTP 404: swagger UI not found
```

**Fix:**
- Ensure running in Development environment: `DOTNET_ENVIRONMENT=Development dotnet run`
- Or set in code: `app.Environment.IsDevelopment()` should return true

### Tests fail with runtime error

```
Framework: 'Microsoft.NETCore.App', version '8.0.0'
```

**Fix:**
- Ensure .NET 8.0 SDK installed: `dotnet --list-sdks`
- Or run tests on older .NET: `dotnet test --framework net6.0` (if supported)

## What's Working (WS1-1.3)

✅ **Data Model & Persistence**
- Composition → Layer → Note entity relationships
- PostgreSQL with EF Core
- Auto-migration on startup

✅ **CompositionService**
- Create new composition (auto-generates 7 empty layers)
- Retrieve by ID with full data
- Add notes to layers
- Mark layers as complete
- JSON serialization/deserialization

✅ **MidiExportService**
- Generate MIDI files from compositions
- Proper pitch, velocity, timing encoding
- Playable in any DAW

✅ **Unit Tests**
- 14 comprehensive tests
- Roundtrip serialization validation
- CRUD operation verification

## What's Not Working Yet (WS1-1.4+)

❌ **REST API Endpoints** (in progress)
- Need controller with `POST /api/compositions`, `GET /api/compositions/{id}`, etc.

❌ **Frontend** (WS2)
- React components for keyboard, notation, audio
- Interaction layer

❌ **Audio Engine** (WS2)
- Tone.js integration for playback

## Next Steps

1. **[WS1-1.4]** Create REST API endpoints (POST, GET, PUT, DELETE /compositions)
2. **[WS1-1.5]** Integration tests for API layer
3. **[WS2]** Frontend React app with audio + keyboard + notation
4. **[WS3]** End-to-end testing and deployment

---

**Questions?** Check [README.md](./README.md) or [CONTRIBUTING.md](./CONTRIBUTING.md)
