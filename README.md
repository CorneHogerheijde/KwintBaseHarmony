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

## Getting Started

The full local development guide — including prerequisites, Dapr setup, and alternative run modes — is in [RUNNING_LOCALLY.md](RUNNING_LOCALLY.md).

### Quick Setup

```powershell
# 1. Start PostgreSQL
docker-compose up -d postgres

# 2. Start frontend + backend with Dapr (Windows)
pwsh ./scripts/start-dapr-local.ps1
```

**Access points after startup:**

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5051 |
| API | http://localhost:5000 |
| Swagger | http://localhost:5000/swagger |
| Backend Dapr HTTP | http://localhost:3500 |

> **Linux/macOS**: use `dapr run -f .` instead of the PowerShell script.

## Project Status

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for the full project status, completed milestones, and roadmap.

**Current phase**: Phase 5 — Authentication & Circle of Fifths Puzzles  
**Upcoming**: Milestones 5.3 (key-aware puzzles) and 5.4 (notation preview fix)

## Project Structure

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for the full annotated directory tree.

**Top-level layout:**
- `src/frontend/` — ASP.NET Core static files host (Vanilla JS, HTML/CSS)
- `src/backend/` — .NET 10 API (EF Core, Dapr, PostgreSQL)
- `tests/` — xUnit integration + unit tests
- `infra/` — Azure infrastructure (AVM Bicep, 14 resources)
- `scripts/` — Local development helpers
- `_outputs/` — Planning artifacts, specs, brainstorming outputs

## Key Ideas at a Glance

### Core Learning Architecture
- **Puzzle-Based Composition Journey**: Build real pieces while solving harmony puzzles
- **Kwintessence-Inspired Layering**: Layer-by-layer harmonic building
- **Puzzle Types as Teaching Tools**: Logic, pattern, constraint, symmetry puzzles serve specific learning goals

### User Experience
- **Multi-Modal Feedback**: Audio + keyboard + notation in real-time
- **Sonic Tension as Teacher**: Hearing dissonance teaches more than visuals
- **Omnipresent Piano Keyboard**: Always available for free exploration

### Content (Phases 4+)
- **Branching Composition**: Student choice in genre/style (classical, jazz, blues)
- **Modular Pieces**: Combine movements into larger compositions
- **AI-Powered Analysis**: Analyze existing songs to show harmony concepts in real music (planned)

## Contributing & Development Workflow

**All development must follow a pull request (PR) workflow.** Direct commits to `main` are not permitted.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full coding standards, PR template, and review process.

### PR Workflow (Summary)

1. **Create a feature branch** from `main`:
   ```bash
   git checkout main && git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Work on your feature**, committing regularly, then push and create a Pull Request on GitHub.

3. **Merge to main** after review and passing CI. Use "Squash and merge" and delete the branch.

### Branch Naming Conventions

- `feature/brief-description` — New feature
- `bugfix/brief-description` — Bug fix
- `docs/brief-description` — Documentation

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

## References

### Project Documentation

| Document | Description |
|----------|-------------|
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Current phase, completed milestones, and roadmap |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | Full annotated directory tree |
| [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) | Detailed deliverables tables per phase and milestone |
| [RUNNING_LOCALLY.md](RUNNING_LOCALLY.md) | Local development setup (Dapr, Docker, .NET) |
| [CONTRIBUTING.md](CONTRIBUTING.md) | PR workflow, code standards, and review process |
| [infra/README.md](infra/README.md) | Azure infrastructure (Bicep, ACA, snapshot tests) |
| [src/backend/README.md](src/backend/README.md) | Backend API, EF Core, Dapr integration |
| [src/frontend/README.md](src/frontend/README.md) | Frontend architecture, JS modules, Vitest/Cypress |
| [_outputs/planning-artifacts/phase-5-plan.md](_outputs/planning-artifacts/phase-5-plan.md) | Phase 5 milestone specs (auth, circle of fifths, notation) |
| [_outputs/implementation-artifacts/](_outputs/implementation-artifacts/) | Spec documents for individual milestones |
| [_outputs/brainstorming/](_outputs/brainstorming/) | Original ideation session outputs |

### External Resources

- [Dapr Documentation](https://docs.dapr.io)
- [Azure Container Apps](https://learn.microsoft.com/azure/container-apps/)
- [Azure Verified Modules](https://azure.github.io/Azure-Verified-Modules/)
- [Bicep snapshot CLI](https://learn.microsoft.com/azure/azure-resource-manager/bicep/deployment-snapshot)
