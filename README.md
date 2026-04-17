# KwintBaseHarmony

Learn music harmony through intuitive, puzzle-based composition. Build actual musical pieces while mastering harmonic concepts layer by layer.

## Vision

**KwintBaseHarmony** is a music education app designed around a simple truth: the best way to learn harmony is to *compose harmonic music while learning it*.

Rather than memorizing theory rules, students solve progressively complex harmony puzzles that form the foundation of complete musical pieces. The experience is calm, intrinsically motivated, and grounded in the proven pedagogical approach of the **Kwintessence** methodology.

### Core Philosophy

- **Intrinsic Motivation**: No gamification, no streaks, no external pressure. Your desire to make music is the only incentive.
- **Sonic-First Learning**: Harmony is learned through *hearing* it, not seeing it.
- **Guided Experimentation**: Wrong choices are creative exploration, not failures. Suggestions help, not punish.
- **Non-Linear Freedom**: Learn at your own pace, jump between levels, always available for free exploration.
- **Real Instrument Bridge**: Everything learned in the app should be playable on physical instruments.

## The Approach

### Kwintessence-Inspired Pedagogy

KwintBaseHarmony follows the elegant **Kwintessence** structure:

1. Start with **root + 5th** (the foundation)
2. Add the **3rd** (major or minor—define the color)
3. Progressive extensions (**7th, 9th, etc.**—layer by layer)

Each layer is approached through different puzzle types (logic, pattern, constraint, symmetry), so students learn *why* each interval matters, not just what it is.

### Multi-Modal Learning

Every harmonic decision is experienced across three simultaneous channels:
- 🔊 **Sonic**: Hear the tension, resolution, and color of each chord
- 🎹 **Kinesthetic**: Play it on an interactive piano keyboard
- 🎼 **Visual**: See it in real-time musical notation

## Project Status

**Phase**: Active Development  
**Last Updated**: April 16, 2026

### Completed
- ✅ Creative brainstorming session (3 techniques)
- ✅ 9 core ideas organized by theme
- ✅ Design principles defined
- ✅ Phase 1 action plans created
- ✅ REST API (composition CRUD, MIDI export)
- ✅ .NET 10 backend with EF Core + PostgreSQL
- ✅ Vanilla JS frontend (ASP.NET Core static files)
- ✅ Dapr integration (state store, local sidecar)
- ✅ Azure Container Apps infrastructure (AVM Bicep, 14 resources)
- ✅ GitHub Actions CI/CD pipeline (build → test → deploy)
- ✅ Bicep snapshot tests (native `bicep snapshot` CLI)
- ✅ Phase 2: Puzzle-based composition UI with interactive piano, notation, audio playback
- ✅ Phase 3A: `LAYER_COUNT` constant, Unicode accidentals, Vitest unit test suite (48 tests)
- ✅ Phase 3B: Root-note transposition — 7 root options, full puzzle layer shift
- ✅ Phase 3C: Chord puzzle type — multi-note layers, chord hint highlighting
- ✅ Phase 3D: Correct accidental placement, time signature, chord notation rendering
- ✅ Phase 3E: Harmonic Understanding panel — collapsible explanation for all 28 puzzle layers
- ✅ Phase 3F: Expanded circle-of-fifths widget with inner minor chord ring

### Upcoming
- 📋 Phase 4: Branching composition paths and genre/style selection
- 📋 Phase 5: AI-powered harmonic analysis of existing songs
- 📋 Real-world testing with musicians and music educators

## Project Structure

```
KwintBaseHarmony/
├── README.md                          # This file
├── DEVELOPMENT_PLAN.md                # Phase 1 action plans
├── RUNNING_LOCALLY.md                 # Local dev guide
├── LICENSE
├── .gitignore
├── dapr.yaml                          # Multi-app run config
├── docker-compose.yml                 # Local Dapr environment
│
├── .github/
│   └── workflows/
│       └── deploy.yml                 # CI/CD: test → build → deploy
│
├── infra/                             # Azure infrastructure (AVM Bicep)
│   ├── main.bicep                     # Orchestrator — 14 Azure resources
│   ├── main.bicepparam                # Production parameters
│   ├── main.test.bicepparam           # Test parameters (snapshot baseline)
│   ├── main.test.snapshot.json        # Committed Bicep snapshot baseline
│   └── tests/
│       └── Test-BicepSnapshot.ps1     # Snapshot drift detection script
│
├── src/
│   ├── frontend/                      # ASP.NET Core static files frontend
│   │   ├── Program.cs
│   │   ├── KwintBaseHarmony.Frontend.csproj
│   │   └── wwwroot/
│   │       ├── index.html             # Dashboard: start/resume composition
│   │       ├── puzzle.html            # Puzzle page: interactive harmony learning
│   │       ├── studio.html            # Studio: free composition editor
│   │       ├── styles.css             # Shared styles
│   │       ├── app.js                 # Dashboard JS
│   │       ├── puzzle.js              # Puzzle page logic
│   │       └── scripts/
│   │           ├── audio.js           # Web Audio API note preview
│   │           ├── circle-of-fifths.js # SVG circle of fifths (major + minor rings)
│   │           ├── midi.js            # Web MIDI input
│   │           ├── music.js           # MIDI/interval utilities, LAYER_COUNT
│   │           ├── notation.js        # ABC.js notation rendering
│   │           ├── piano.js           # 88-key interactive piano with zoom
│   │           ├── playback.js        # Arpeggio and layer playback
│   │           └── puzzle-engine.js   # Puzzle layers (4 difficulties × 7 layers)
│   │
│   └── backend/                       # .NET 10 + EF Core + Dapr
│       ├── Program.cs
│       ├── KwintBaseHarmony.csproj
│       ├── appsettings.json
│       ├── Models/                    # Composition, Layer, Note
│       ├── Services/                  # CompositionService, MidiExportService
│       ├── Data/                      # EF Core DbContext
│       ├── Migrations/
│       └── components/                # Dapr component YAML files
│
├── tests/                             # xUnit integration + unit tests
│   ├── CompositionEndpointsTests.cs
│   ├── CompositionServiceTests.cs
│   ├── MidiExportServiceTests.cs
│   └── KwintBaseHarmony.Tests.csproj
│
├── scripts/
│   └── start-dapr-local.ps1           # Windows Dapr launcher
│
└── _outputs/                          # Project outputs & artifacts
    ├── brainstorming/
    ├── planning-artifacts/
    ├── implementation-artifacts/
    └── test-artifacts/
```

## Key Ideas at a Glance

### Core Learning Architecture
- **Puzzle-Based Composition Journey**: Build real pieces while solving harmony puzzles
- **Kwintessence-Inspired Layering**: Layer-by-layer harmonic building
- **Puzzle Types as Teaching Tools**: Logic, pattern, constraint, symmetry puzzles serve specific learning goals

### User Experience
- **Multi-Modal Feedback**: Audio + keyboard + notation in real-time
- **Sonic Tension as Teacher**: Hearing dissonance teaches more than visuals
- **Omnipresent Piano Keyboard**: Always available for free exploration

### Content (Phase 2+)
- **Branching Composition**: Student choice in genre/style
- **Modular Pieces**: Combine small pieces into larger compositions
- **AI-Powered Analysis**: Analyze existing songs to show harmony concepts in real music

## Contributing & Development Workflow

**All development must follow a pull request (PR) workflow.** Direct commits to `main` are not permitted.

### PR Workflow

1. **Create a feature branch** from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/ws1-1-4-rest-api  # Use descriptive branch names
   ```

2. **Work on your feature**, committing regularly:
   ```bash
   git add .
   git commit -m "Clear, descriptive commit message"
   ```

3. **Push your branch** to remote:
   ```bash
   git push origin feature/ws1-1-4-rest-api
   ```

4. **Create a Pull Request** on GitHub:
   - Provide clear description of changes
   - Link related spec documents or issues
   - Specify which workstream/story this implements
   - Note any breaking changes or dependencies

5. **Code Review**:
   - At least one reviewer must approve before merge
   - Address feedback, push corrections to same branch
   - Keep commits clean and logical

6. **Merge to main**:
   - Use "Squash and merge" for feature branches (keeps history clean)
   - Delete branch after merge
   - Build/tests must pass before merge

### Branch Naming Conventions

Use descriptive branch names following this pattern:
- `feature/ws{X}-{Y}-{Z}-{slug}` — New feature (e.g., `feature/ws1-1-4-rest-api`)
- `bugfix/brief-description` — Bug fix (e.g., `bugfix/midi-export-timing`)
- `docs/update-readme` — Documentation (e.g., `docs/add-pr-workflow`)
- `refactor/service-simplification` — Code refactoring

### Commit Message Guidelines

Write clear, actionable commit messages:
```
[WS1-1.4] Add composition CRUD endpoints

- POST /api/compositions (create new)
- GET /api/compositions/:id (retrieve)
- PUT /api/compositions/:id (update)
- DELETE /api/compositions/:id
- Tested with xUnit integration tests

Closes #15
```

### Status Before PR Merge

Before submitting a PR, ensure:
- ✅ Code compiles (`dotnet build`)
- ✅ Unit tests pass (`dotnet test`)
- ✅ GitHub Actions CI passes (`.github/workflows/pipelines.yaml`)
- ✅ No console warnings (address or document)
- ✅ Code follows project conventions
- ✅ Commits are logically organized
- ✅ Branch is up-to-date with `main`

### Workstream Tags

Tag commits and PRs with workstream labels:
- `WS1` — Learning Architecture
- `WS2` — Multi-Modal Interaction
- `WS3` — Integration & Testing

Example: `[WS1-1.3] Complete data model with EF persistence`

---

## Getting Started (Development)

See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for detailed Phase 1 implementation roadmap.

**Quick Start Requirements:**
- Music theory consultant (validate pedagogy)
- Full-stack developer (frontend + backend)
- UX designer (calm, intuitive interface)

---

## Architecture: Vanilla JS Frontend + .NET Dapr Backend

### Technology Stack

**Frontend:**
- 🌐 **Vanilla JS + HTML/CSS** — Lightweight browser-native UI
- 🔵 **ASP.NET Core** — Static file host (no Node.js build step)

**Backend:**
- 🔵 **.NET 10** — API runtime
- 🔄 **Dapr Runtime** — Distributed application runtime (state store, sidecar)
- 📚 **Entity Framework Core** — ORM with PostgreSQL
- 🎵 **MIDI export** — NAudio-based MIDI file generation

**Infrastructure & Deployment:**
- ☁️ **Azure Container Apps** — Serverless container hosting
- 🏗️ **AVM Bicep** — Infrastructure as Code (14 Azure resources)
- 🔒 **Azure Key Vault** — Secret management
- 🐘 **Azure Database for PostgreSQL Flexible Server** — Managed database
- 📦 **Azure Container Registry** — Docker image registry
- 🐳 **Docker** — Containerization
- ⚙️ **GitHub Actions** — CI/CD pipeline (test → build → deploy)
- 🎯 **Dapr CLI** — Local development environment
- 📊 **BMAD** — Project methodology and brainstorming framework

---

## Quick Setup

### Prerequisites

- **.NET 10 SDK** (frontend and backend)
- **Dapr CLI** (installed and initialized)
- **Docker** (for Dapr containers)
- **Git**

### 1. Clone & Initial Setup

```bash
# Clone the repository
git clone https://github.com/CorneHogerheijde/KwintBaseHarmony.git
cd KwintBaseHarmony

# Initialize Dapr
dapr init
```

For Windows, use the local launcher in `scripts/start-dapr-local.ps1` instead of `dapr run -f .`.

### 2. Frontend + Backend with Dapr

#### Windows

```powershell
pwsh ./scripts/start-dapr-local.ps1
```

#### Linux/macOS

```bash
dapr run -f .
```

Access points:
- Frontend: `http://localhost:5051`
- API: `http://localhost:5000`
- Swagger: `http://localhost:5000/swagger`
- Backend Dapr HTTP: `http://localhost:3500`
- Frontend Dapr HTTP: `http://localhost:3510`

### 3. Direct .NET Alternative

```bash
cd src/backend

# Restore dependencies
dotnet restore

# Start without Dapr for testing
dotnet run
```

The backend will be available at `http://localhost:5000`

### 4. Testing Together

Once both are running:

1. Open frontend at `http://localhost:5051`
2. The frontend will connect to the backend API
3. Create or load a composition from the dashboard
4. Export JSON or MIDI from the loaded composition

---

## Dapr Workflow Integration

**How Dapr Workflows orchestrate user interactions:**

1. **Puzzle Workflow** — Orchestrates the puzzle flow
   - User selects notes on piano
   - Workflow validates against expected answer
   - Audio + notation feedback triggered
   - Next puzzle initiated

2. **Composition Workflow** — Manages multi-step composition
   - Each layer (root+5th, +3rd, etc.) is a workflow step
   - State persisted between sessions
   - Allows pausing/resuming

3. **User Input Processing** — Dapr Workflow handles:
   - Note input sequences
   - Validation logic
   - Feedback generation
   - State transitions

**Reference:** [Dapr Workflow Concerto Example](https://github.com/diagrid-labs/dapr-workflow-concerto)


---

## Deployment

The app deploys to **Azure Container Apps** via GitHub Actions on every push to `main` (after Bicep snapshot validation and Docker image build).

### Infrastructure

All Azure resources are defined in `infra/main.bicep` using Azure Verified Modules (AVM):

| Resource | Purpose |
|---|---|
| Container Apps Environment | Shared runtime for both containers |
| Backend Container App | .NET 10 API |
| Frontend Container App | ASP.NET Core static file host |
| PostgreSQL Flexible Server | Managed database |
| Key Vault | Secrets (DB password, connection strings) |
| Container Registry | Docker image storage |
| Log Analytics Workspace | Centralized logs |
| Managed Identity + Role Assignments | Least-privilege access |

### Bicep Snapshot Tests

Bicep drift detection runs on every PR via `bicep snapshot --mode validate`. If the compiled template differs from the committed baseline, CI fails.

To update the baseline after an intentional Bicep change:
```sh
bicep snapshot infra/main.test.bicepparam --mode overwrite
git add infra/main.test.snapshot.json && git commit -m "chore: update Bicep snapshot baseline"
```

To run the check locally:
```powershell
pwsh -NoProfile -File infra/tests/Test-BicepSnapshot.ps1
```

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `AZURE_CLIENT_ID` | Service principal / workload identity client ID |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Target subscription |
| `AZURE_RESOURCE_GROUP` | Target resource group |
| `ACR_LOGIN_SERVER` | Azure Container Registry login server |
| `POSTGRES_ADMIN_PASSWORD` | PostgreSQL admin password |

---

## Development Tools & Methodology

### BMAD (Brainstorming Method & Design)

This project uses **BMAD** for structured ideation and development planning:

- **Brainstorming Sessions** — Used to generate the 9 core ideas
- **Architecture Design** — Documented in DEVELOPMENT_PLAN.md
- **Workflow Organization** — Tracks progress and dependencies
- **Skill Development** — Continuous improvement methodology

### Development Workflow

1. **Ideation** → BMAD brainstorming sessions
2. **Planning** → DEVELOPMENT_PLAN workstreams
3. **Implementation** → Code in organized workstreams
4. **Testing** → `dotnet test` + Bicep snapshot CI
5. **Iteration** → Refinement based on real-world usage

---

## Resources

- **Kwintessence Book Reference**: Layer-by-layer harmonic pedagogy
- **Brainstorming Session**: `_outputs/brainstorming/brainstorming-session-2026-04-14.md`
- **Development Plan**: [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)
- **Running Locally**: [RUNNING_LOCALLY.md](./RUNNING_LOCALLY.md)
- **Dapr Documentation**: https://docs.dapr.io
- **Azure Container Apps**: https://learn.microsoft.com/azure/container-apps/
- **Azure Verified Modules**: https://azure.github.io/Azure-Verified-Modules/
- **Bicep snapshot CLI**: https://learn.microsoft.com/azure/azure-resource-manager/bicep/deployment-snapshot


---

## Contributing

This project is in active development. For now, this is a personal/team project. Future contributions welcome once structure stabilizes.

## License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

Copyright © 2026 Corné Hogerheijde

---

## Thank You for the Inspiration

**Robijn Tilanus** — the harmonic framework at the heart of this project is inspired by *KWINTessens: Praktische benadering Harmonieleer*, a beautifully practical approach to music theory that made the idea of a layered, progressive harmony puzzle feel natural and achievable.

**Marc Duiker** ([@marcduiker](https://github.com/marcduiker), [Diagrid](https://www.diagrid.io/)) — the Dapr Workflow architecture drew inspiration from Marc's session and the [dapr-workflow-concerto](https://github.com/diagrid-labs/dapr-workflow-concerto/) project, which demonstrated how Dapr Workflows can orchestrate creative, multi-step processes in an elegant and scalable way.

---
