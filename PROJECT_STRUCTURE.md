# KwintBaseHarmony — Project Structure

```
KwintBaseHarmony/
├── README.md                          # Project overview & quick start
├── PROJECT_STATUS.md                  # Phase history & roadmap
├── PROJECT_STRUCTURE.md               # This file
├── DEVELOPMENT_PLAN.md                # Detailed phase deliverables
├── CONTRIBUTING.md                    # Development workflow & standards
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
│   ├── secrets.bicep                  # Key Vault secrets module
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
│   │       ├── login.html             # Authentication: login
│   │       ├── register.html          # Authentication: register
│   │       ├── progress.html          # Analytics dashboard
│   │       ├── styles.css             # Shared styles
│   │       ├── app.js                 # Dashboard JS
│   │       ├── puzzle.js              # Puzzle page logic
│   │       └── scripts/
│   │           ├── audio.js           # Web Audio API note preview
│   │           ├── auth.js            # JWT helpers (getToken, requireAuth, etc.)
│   │           ├── api.js             # Fetch wrapper with Authorization header
│   │           ├── circle-of-fifths.js # SVG circle of fifths (major + minor rings)
│   │           ├── midi.js            # Web MIDI input
│   │           ├── music.js           # MIDI/interval utilities, LAYER_COUNT
│   │           ├── nav-auth.js        # Login/logout nav widget (injected on all pages)
│   │           ├── notation.js        # ABC.js notation rendering
│   │           ├── piano.js           # 88-key interactive piano with zoom
│   │           ├── playback.js        # Arpeggio and layer playback
│   │           └── puzzle-engine.js   # Puzzle layers (4 difficulties × 7 layers)
│   │
│   └── backend/                       # .NET 10 + EF Core + Dapr
│       ├── Program.cs
│       ├── KwintBaseHarmony.csproj
│       ├── appsettings.json
│       ├── Models/                    # Composition, Layer, Note, User
│       ├── Services/                  # CompositionService, MidiExportService, JwtService
│       ├── Auth/                      # AuthDtos, AuthEndpoints
│       ├── Api/                       # Endpoint groups (composition, layer, analytics, export)
│       ├── Data/                      # EF Core DbContext
│       ├── Migrations/
│       └── components/                # Dapr component YAML files
│
├── tests/                             # xUnit integration + unit tests
│   ├── CompositionEndpointsTests.cs
│   ├── CompositionServiceTests.cs
│   ├── MidiExportServiceTests.cs
│   ├── AuthEndpointsTests.cs
│   └── KwintBaseHarmony.Tests.csproj
│
├── scripts/
│   └── start-dapr-local.ps1           # Windows Dapr launcher
│
└── _outputs/                          # Project outputs & artifacts
    ├── brainstorming/                 # Ideation session outputs
    ├── planning-artifacts/            # Phase-level plans
    ├── implementation-artifacts/      # Spec documents per milestone
    └── test-artifacts/                # Test plans and results
```
