# Running KwintBaseHarmony Locally

This guide shows how to run the backend API with Dapr. **Currently, only the backend (WS1-1.3) is functional.**

## Prerequisites

- **.NET SDK 8.0+** [Download](https://dotnet.microsoft.com/download)
- **Docker & Docker Compose** [Download](https://www.docker.com/products/docker-desktop)
- **Dapr CLI** [Download](https://dapr.io/download)
- **Git**

## Quick Start (Recommended: Dapr + Docker)

### 1. Start Infrastructure (PostgreSQL + Redis)

```bash
cd c:\Projects\bmad\KwintBaseHarmony

# Start all services in Docker
docker-compose up -d

# Verify running:
docker ps
# Should see: postgres, redis, placement, kwintbaseharmony-api-dapr
```

### 2. Initialize Dapr (One-Time)

```bash
dapr init
```

This sets up Dapr components and Redis state store locally.

### 3. Run the Backend

```bash
cd src/backend
dapr run --app-id kwintbaseharmony-api \
         --app-port 5000 \
         --config ../dapr.yaml \
         -- dotnet run
```

✅ **Done!** Backend is running with Dapr sidecar.

**Access points:**
- **API**: `http://localhost:5000`
- **Swagger**: `http://localhost:5000/swagger`
- **Dapr HTTP**: `http://localhost:3500` (sidecar)

---

## Alternative: Direct .NET (Without Dapr)

If you prefer to skip Dapr for simple testing:

### 1. Start PostgreSQL Only

```bash
docker-compose up -d postgres
```

### 2. Run .NET Backend

```bash
cd src/backend
dotnet run
```

**Note**: No Dapr sidecar, no workflow support, but simpler setup.

---

## Setup (Already Done, Reference Only)

### PostgreSQL Configuration

PostgreSQL is configured in `docker-compose.yml`:
- **Host**: `postgres` (or `localhost` from host machine)
- **Port**: `5432`
- **Database**: `kwintbaseharmony`
- **User**: `postgres`
- **Password**: `postgres`

### Dapr Components

Located in `src/backend/components/`:
- `state.yaml` — Redis state store (for workflows, actor storage)
- `postgres.yaml` — PostgreSQL reference (for future Dapr-native queries)

### Restore Dependencies

```bash
dotnet restore
```

## Running the Backend

### Option A: Direct (Simplest for Development)

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

### Option B: With Dapr Sidecar (Recommended for Production-like Testing)

**Prerequisites**: Dapr CLI installed [here](https://dapr.io/download/)

```bash
# 1. Ensure Docker containers are running
docker-compose up -d

# 2. Initialize Dapr (one-time)
dapr init

# 3. Start the backend with Dapr sidecar
cd src/backend
dapr run --app-id kwintbaseharmony-api --app-port 5000 --config ../dapr.yaml -- dotnet run
```

**What this does:**
- Runs the .NET backend on port 5000
- Loads `dapr.yaml` configuration (standalone mode, Redis state store)
- Dapr sidecar listens on ports 3500 (HTTP) and 3501 (gRPC)
- You can invoke Dapr APIs for state/pub-sub (Phase 2+)

**Dapr Sidecar Endpoints:**
- Dapr HTTP API: `http://localhost:3500`
- State management: `http://localhost:3500/v1.0/state`
- Pub/Sub: `http://localhost:3500/v1.0/publish`
- Invoke service: `http://localhost:3500/v1.0/invoke/{service-id}/method/{method}`

### Database Auto-Migration

On first run in Development environment, the database schema is automatically created:
- `Compositions` table
- `Layers` table (with composite unique index)
- `Notes` table (with playback-order index)

## Dapr Configuration

**File**: `dapr.yaml` at project root

This file configures Dapr for local development:

```yaml
apiVersion: dapr.io/v1alpha1
kind: Configuration
metadata:
  name: kwintbaseharmony-config
spec:
  mtls:
    enabled: false                    # Disabled for local dev
  tracing:
    samplingRate: "1"
    zipkin:
      endpointAddress: "..."          # For observability
  logging:
    level: info
  runMode: standalone
```

**Key settings:**
- `mtls.enabled: false` — No mutual TLS in dev (simplifies testing)
- `logging.level: info` — Console logging
- `runMode: standalone` — Works without Dapr cluster (for local development)

**Usage:**
```bash
dapr run --config dapr.yaml -- dotnet run
```

**Components** (state, secrets, pub/sub):
- Located in `src/backend/components/`
- `state.yaml` — Redis state store for workflow/actor storage
- Add more components as needed (databases, message brokers, etc.)

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

### Dapr sidecar fails to start

```
Error: cannot find config file at /path/to/dapr.yaml
```

**Fix:**
- Ensure `dapr.yaml` exists at project root: `ls dapr.yaml` (should exist)
- Run `dapr run` from the project root, not `src/backend/`
- Full command: `dapr run --app-id kwintbaseharmony-api --app-port 5000 --config dapr.yaml -- dotnet run`

### "Redis connection refused" with Dapr

```
Error: ERR failed to connect to state store: redis
```

**Fix:**
- Ensure Redis is running: `docker-compose up -d redis`
- Check `src/backend/components/state.yaml` has correct Redis address
- Default: `redis:6379` (works with Docker Compose network)
- For local Redis: Change to `localhost:6379`

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
