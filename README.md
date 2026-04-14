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

**Phase**: Pre-Development  
**Last Updated**: April 14, 2026

### Completed
- ✅ Creative brainstorming session (3 techniques)
- ✅ 9 core ideas organized by theme
- ✅ Design principles defined
- ✅ Phase 1 action plans created

### In Progress
- ⏳ Development planning
- ⏳ Technical stack finalization
- ⏳ Team assembly

### Upcoming
- 📋 Phase 1: MVP development (4-6 weeks)
- 📋 Phase 2: Expansion features
- 📋 Phase 3: Real-world testing & iteration

## Project Structure

```
KwintBaseHarmony/
├── README.md                          # This file
├── DEVELOPMENT_PLAN.md                # Detailed Phase 1 action plans
├── .gitignore                         # Git ignore rules
├── _outputs/                          # Project outputs & artifacts
│   ├── brainstorming/
│   │   └── brainstorming-session-2026-04-14.md
│   ├── planning-artifacts/
│   ├── implementation-artifacts/
│   └── test-artifacts/
├── docs/                              # Documentation (future)
├── src/                               # Source code (future)
│   ├── components/
│   ├── audio/
│   ├── notation/
│   └── learning/
└── tests/                             # Test files (future)
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

## Architecture: React Frontend + .NET Dapr Backend

### Technology Stack

**Frontend:**
- ⚛️ **React 18** — Interactive UI framework
- 📘 **TypeScript** — Type safety
- 🎹 **Tone.js** — Web Audio API abstraction
- 🎼 **Vexflow** — Musical notation rendering
- 🎨 **Tailwind CSS** — Utility-first styling
- 📦 **Vite** — Modern build tool

**Backend:**
- 🔵 **.NET 10** — Backend runtime
- 🔄 **Dapr Runtime** — Distributed application runtime
- 🔀 **Dapr Workflow** — Orchestrate user input flows (note sequences, puzzle progression)
- 🎵 **NAudio** — Audio engine integration
- 📚 **Entity Framework Core** — Data persistence

**Development & Deployment:**
- 🐳 **Docker** — Containerization
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

### 2. Frontend Setup

```bash
cd src/frontend
dotnet run --no-launch-profile --urls http://localhost:5051
```

The frontend will be available at `http://localhost:5051`
The frontend will also be available through the Dapr multi-app setup at `http://localhost:5051`

### 3. Backend Setup

```bash
cd src/backend

# Restore dependencies
dotnet restore

# Start with Dapr
dapr run --app-id kwintbaseharmony-api \
         --app-port 7000 \
         --resources-path ./components \
         -- dotnet run

# Or without Dapr for testing
dotnet run
```

The backend will be available at `http://localhost:7000`

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

## Project Structure

```
KwintBaseHarmony/
├── README.md                          # This file
├── DEVELOPMENT_PLAN.md                # Phase 1 action plans
├── LICENSE                            # MIT License
├── .gitignore
├── docker-compose.yml                 # Local Dapr environment
│
├── src/
│   ├── frontend/                      # ASP.NET Core static frontend
│   │   ├── Program.cs
│   │   ├── KwintBaseHarmony.Frontend.csproj
│   │   └── wwwroot/
│   │       ├── index.html
│   │       ├── styles.css
│   │       └── app.js
│   │
│   └── backend/                       # .NET 10 + Dapr
│       ├── Program.cs                 # Dapr setup
│       ├── Controllers/
│       │   ├── PuzzleController.cs
│       │   ├── CompositionController.cs
│       │   └── ...
│       ├── Workflows/
│       │   ├── PuzzleWorkflow.cs
│       │   ├── CompositionWorkflow.cs
│       │   └── ...
│       ├── Models/
│       │   ├── Puzzle.cs
│       │   ├── Note.cs
│       │   └── ...
│       ├── Components/
│       │   ├── pubsub.yaml            # Dapr pub/sub config
│       │   ├── state.yaml             # Dapr state store config
│       │   └── ...
│       ├── KwintBaseHarmony.csproj
│       └── appsettings.json
│
└── _outputs/
    ├── brainstorming/
    ├── planning-artifacts/
    ├── implementation-artifacts/
    └── test-artifacts/
```

---

## Development Tools & Methodology

### BMAD (Brainstorming Method & Design)

This project uses **BMAD** for structured ideation and development planning:

- **Brainstorming Sessions** — Used to generate the 9 core ideas
- **Architecture Design** — Documented in DEVELOPMENT_PLAN.md
- **Workflow Organization** — Tracks progress and dependencies
- **Skill Development** — Continuous improvement methodology

Read more: [BMAD Documentation](https://github.com/microsoft/BuildMethodology)

### Development Workflow

1. **Ideation** → BMAD brainstorming sessions
2. **Planning** → DEVELOPMENT_PLAN workstreams
3. **Implementation** → Code in organized workstreams
4. **Testing** → Internal musician feedback loops
5. **Iteration** → Refinement based on real-world usage

---

## Resources

- **Kwintessence Book Reference**: Layer-by-layer harmonic pedagogy
- **Brainstorming Session**: `_outputs/brainstorming/brainstorming-session-2026-04-14.md`
- **Development Plan**: `DEVELOPMENT_PLAN.md`
- **Dapr Documentation**: https://docs.dapr.io
- **Dapr Workflow Example**: https://github.com/diagrid-labs/dapr-workflow-concerto
- **BMAD Method**: Brainstorming & design methodology used for this project

---
- 🎨 **Tailwind CSS** — Utility-first styling
- 📦 **Vite** — Modern build tool

**Backend:**
- 🔵 **.NET 10** — Backend runtime
- 🔄 **Dapr Runtime** — Distributed application runtime
- 🔀 **Dapr Workflow** — Orchestrate user input flows (note sequences, puzzle progression)
- 🎵 **NAudio** — Audio engine integration
- 📚 **Entity Framework Core** — Data persistence

**Development & Deployment:**
- 🐳 **Docker** — Containerization
- 🎯 **Dapr CLI** — Local development environment
- 📊 **BMAD** — Project methodology and brainstorming framework

---

## Quick Setup

### Prerequisites

- **Node.js** 18+ (frontend)
- **.NET 10 SDK** (backend)
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

### 2. Frontend Setup

```bash
cd src/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5051`

### 3. Backend Setup

```bash
cd src/backend

# Restore dependencies
dotnet restore

# Start with Dapr
dapr run --app-id kwintbaseharmony-api \
         --app-port 7000 \
         --resources-path ./components \
         -- dotnet run

# Or without Dapr for testing
dotnet run
```

The backend will be available at `http://localhost:7000`

### 4. Testing Together

Once both are running:

1. Open frontend at `http://localhost:5051`
2. The frontend will connect to the backend API
3. Piano keyboard should be interactive
4. Ready to start the first puzzle!

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

## Project Structure

```
KwintBaseHarmony/
├── README.md                          # This file
├── DEVELOPMENT_PLAN.md                # Phase 1 action plans
├── LICENSE                            # MIT License
├── .gitignore
├── docker-compose.yml                 # Local Dapr environment
│
├── src/
│   ├── frontend/                      # React + TypeScript
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── components/            # React components
│   │   │   │   ├── PianoKeyboard.tsx
│   │   │   │   ├── NotationDisplay.tsx
│   │   │   │   ├── PuzzleUI.tsx
│   │   │   │   └── ...
│   │   │   ├── pages/
│   │   │   │   ├── Welcome.tsx
│   │   │   │   ├── PuzzlePage.tsx
│   │   │   │   └── ...
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── backend/                       # .NET 10 + Dapr
│       ├── Program.cs                 # Dapr setup
│       ├── Controllers/
│       │   ├── PuzzleController.cs
│       │   ├── CompositionController.cs
│       │   └── ...
│       ├── Workflows/
│       │   ├── PuzzleWorkflow.cs
│       │   ├── CompositionWorkflow.cs
│       │   └── ...
│       ├── Models/
│       │   ├── Puzzle.cs
│       │   ├── Note.cs
│       │   └── ...
│       ├── Components/
│       │   ├── pubsub.yaml            # Dapr pub/sub config
│       │   ├── state.yaml             # Dapr state store config
│       │   └── ...
│       ├── KwintBaseHarmony.csproj
│       └── appsettings.json
│
└── _outputs/
    ├── brainstorming/
    ├── planning-artifacts/
    ├── implementation-artifacts/
    └── test-artifacts/
```

---

## Development Tools & Methodology

### BMAD (Brainstorming Method & Design)

This project uses **BMAD** for structured ideation and development planning:

- **Brainstorming Sessions** — Used to generate the 9 core ideas
- **Architecture Design** — Documented in DEVELOPMENT_PLAN.md
- **Workflow Organization** — Tracks progress and dependencies
- **Skill Development** — Continuous improvement methodology

Read more: [BMAD Documentation](https://github.com/microsoft/BuildMethodology)

### Development Workflow

1. **Ideation** → BMAD brainstorming sessions
2. **Planning** → DEVELOPMENT_PLAN workstreams
3. **Implementation** → Code in organized workstreams
4. **Testing** → Internal musician feedback loops
5. **Iteration** → Refinement based on real-world usage

---

## Resources

- **Kwintessence Book Reference**: Layer-by-layer harmonic pedagogy
- **Brainstorming Session**: `_outputs/brainstorming/brainstorming-session-2026-04-14.md`
- **Development Plan**: `DEVELOPMENT_PLAN.md`
- **Dapr Documentation**: https://docs.dapr.io
- **Dapr Workflow Example**: https://github.com/diagrid-labs/dapr-workflow-concerto
- **BMAD Method**: Brainstorming & design methodology used for this project

---

## Contributing

This project is in active development. For now, this is a personal/team project. Future contributions welcome once structure stabilizes.

## License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

Copyright © 2026 Corné Hogerheijde

---

**Last Updated**: April 14, 2026  
**Created by**: Corné  
**Project Status**: Brainstorming → Development Planning
