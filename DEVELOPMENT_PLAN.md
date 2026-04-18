# KwintBaseHarmony - Development Plan

## Overview

**Goal**: Build a functional MVP that demonstrates the core "harmony learning through composition puzzles" concept, and progressively expand into a full Phase 3 feature set.

**Timeline**: Active development  
**Target Users**: Musicians and music educators

---

## Phase 5 — Authentication & Authorization

**Phase 5.1 Status** *(April 18, 2026)*: ✅ **Complete** — PR #38 merged

**Phase 5.2 Status** *(April 18, 2026)*: ✅ **Complete** — Auth enforcement on all endpoints

### Phase 5.2 Deliverables — Auth Enforcement

| Feature | Description | Status |
|---------|-------------|--------|
| `RequireAuthorization()` | Added to all 5 endpoint groups: compositions, layers, movements, export, analytics | ✅ |
| Composition `UserId` FK | `POST /api/compositions` extracts `sub` claim and stores `UserId` on composition | ✅ |
| `GET /api/compositions` | New endpoint — returns only the authenticated user's compositions via `GetByUserIdAsync` | ✅ |
| `ICompositionService` | Added `GetByUserIdAsync(Guid userId)` + updated `CreateAsync` signature with `Guid? userId` | ✅ |
| `TestAuthHandler` | Auto-authenticates all test HTTP requests so existing tests remain green with `RequireAuthorization()` | ✅ |
| JWT `MapInboundClaims = false` | Keeps JWT claim names as-is (`sub` stays `sub`) so claim lookups work correctly | ✅ |
| 3 new auth tests | `Me_WithValidToken`, `Compositions_WithoutToken`, `GetMyCompositions_ReturnsOnlyOwnCompositions` | ✅ |

**Test coverage**: 49 passing tests (47 original + new auth integration tests)

### Phase 5.1 Deliverables — Authentication MVP

| Feature | Description | Status |
|---------|-------------|--------|
| `User` entity | `Id`, `Email`, `PasswordHash` (BCrypt), `Role` (Student/Educator), `CreatedAt`, nav to `Compositions` | ✅ |
| EF migration `AddAuthentication` | `Users` table + nullable `UserId` FK on `Compositions` (SetNull on delete) | ✅ |
| `POST /api/auth/register` | Validate email/password, hash, return JWT | ✅ |
| `POST /api/auth/login` | Verify BCrypt hash, return JWT | ✅ |
| `GET /api/auth/me` | RequireAuthorization — returns claims from token | ✅ |
| `JwtService` | Generates signed JWT; reads `Jwt:Key/Issuer/Audience` from config | ✅ |
| `scripts/auth.js` | `getToken`/`setAuth`/`clearAuth`/`isLoggedIn`/`requireAuth` helpers | ✅ |
| `scripts/nav-auth.js` | Renders login/logout nav widget; injected on all pages | ✅ |
| `scripts/api.js` | Attaches `Authorization: Bearer` header when token present | ✅ |
| `login.html` / `login.js` | Email + password form; stores token in `sessionStorage` | ✅ |
| `register.html` / `register.js` | Email + password + role form | ✅ |
| Auth nav on all pages | `index.html`, `puzzle.html`, `progress.html` | ✅ |

---

**Phase 3 Status** *(April 16, 2026)*: ✅ **Complete**

**Phase 4A Status** *(April 17, 2026)*: ✅ **Complete**

**Phase 4B Status** *(April 17, 2026)*: ✅ **Complete**

**Phase 4C Status** *(April 17, 2026)*: ✅ **Complete**

### Phase 4C Deliverables — Progress & Analytics Dashboard

| Feature | Description | Status |
|---------|-------------|--------|
| `progress.html` | New standalone page; Chart.js CDN; summary cards + bar charts + layer table | ✅ |
| `progress.js` | Fetches `GET /api/compositions/{id}/analytics`; renders summary, two Chart.js bar charts, detail table | ✅ |
| URL pre-population | `?id=<guid>` query param auto-loads analytics on arrival | ✅ |
| Summary stat cards | Completion %, total time (formatted), first-try rate %, avg attempts per layer | ✅ |
| Time-per-layer chart | Bar chart — green fill for completed layers, faded for incomplete | ✅ |
| Attempts chart | Bar chart — green = first-try correct, amber = retried, faded = not yet done | ✅ |
| Layer detail table | Tabular view: layer #, name, status, time (s), attempts, first-try column | ✅ |
| Nav integration | "Progress ↗" link in puzzle nav (dynamic href = `?id=<id>`); "Progress" in home footer | ✅ |
| CSS | `.progress-main`, `.stat-card`, `.stat-value/label`, `.progress-charts`, `.progress-table`, `.progress-nav-link` | ✅ |
| Cypress tests | `progress-analytics.cy.js` — 11 E2E scenarios covering form, error, display, URL pre-pop, nav links | ✅ |

**Test coverage**: 72 Vitest unit tests (unchanged) + ~78 Cypress E2E tests (est.)

### Phase 4B Deliverables — Branching Style Choices

| Feature | Description | Status |
|---------|-------------|--------|
| Style property | `Style` column on `Composition` — `"classical"` (default), `"jazz"`, `"blues"` | ✅ |
| DB migration | `20260417000001_AddStyle` — `VARCHAR(50) NOT NULL DEFAULT 'classical'` | ✅ |
| Validation | `AllowedStyleValues` HashSet in `Composition`; 422 on invalid style | ✅ |
| API request/response | `CreateCompositionRequest.Style`, `CompositionResponse.Style` | ✅ |
| Movement inheritance | `CreateNextMovementAsync` inherits `Style` from root movement | ✅ |
| Jazz layer overrides | Layer 4 → B♭4 (MIDI 70, dominant seventh) for beginner/intermediate/advanced | ✅ |
| Blues layer overrides | Layer 3 → E♭4 (63), Layer 4 → B♭4 (70), Layer 5 → G♭4 (66) for all difficulties | ✅ |
| `puzzle-engine.js` | `getPuzzleLayers(difficulty, style)` — routes to style table; all style-aware functions updated | ✅ |
| Home page style picker | `<select id="style-input">` with classical/jazz/blues options; posted in create request | ✅ |
| Puzzle page style badge | `#style-badge` with `.style-badge--jazz` / `.style-badge--blues` classes; hidden for classical | ✅ |
| CSS | `.style-badge`, `.style-badge--jazz` (gold), `.style-badge--blues` (blue) | ✅ |
| xUnit tests | 3 new tests: jazz style persists, invalid style → 422, no style → classical default | ✅ |
| Vitest tests | 10 new tests covering jazz + blues layer overrides and unknown-style fallback | ✅ |
| Cypress tests | `style-presets.cy.js` — style picker UI, POST body assertions, style badge rendering | ✅ |

**Test coverage**: 72 Vitest unit tests + 67 Cypress E2E tests (est.)

### Phase 4A Deliverables — Modular Compositions + Puzzle Type Variety

| Feature | Description | Status |
|---------|-------------|--------|
| Movement data model | `MovementNumber` (1–3) + `ParentCompositionId` FK on `Composition` entity | ✅ |
| DB migration | `20260417000000_AddMovements` — adds columns, self-referencing FK, index | ✅ |
| Service layer | `CreateNextMovementAsync` + `GetMovementChainAsync` in `CompositionService` | ✅ |
| API endpoints | `POST /{id}/movements` (201/404/409) + `GET /{id}/movements` | ✅ |
| Multiple-choice puzzle | `getMultipleChoiceOptions` — 4 shuffled options, 1 correct, for movement 3 | ✅ |
| Movement-aware puzzle UI | Movement 1 = note-select, 2 = chord, 3 = multiple-choice; piano hidden in movement 3 | ✅ |
| Completion flow | "Continue to Movement II/III →" button; navigates to new movement after POST | ✅ |
| Home page grouping | Multi-movement compositions grouped under one entry; navigates to first incomplete movement | ✅ |
| Multiple-choice styles | `.mc-option-btn`, `.mc-correct`, `.mc-incorrect` CSS classes | ✅ |
| Backend tests | 4 new xUnit tests for movement endpoints | ✅ |
| Vitest tests | 5 new tests for `getMultipleChoiceOptions` (62 total) | ✅ |
| Cypress tests | `movement-flow.cy.js` — 6 E2E scenarios for movement flow + multiple-choice UI | ✅ |

**Test coverage**: 62 Vitest unit tests + 60 Cypress E2E tests (est.)

### Phase 3 Deliverables — All Merged to Main

| Phase | Feature | Status |
|-------|---------|--------|
| 3A | `LAYER_COUNT` constant, Unicode accidentals, Vitest unit test suite (48 tests) | ✅ |
| 3B | Root-note transposition — 7 root options, all puzzle layers transpose accordingly | ✅ |
| 3C | Chord puzzle type — multi-note target layers, chord hint key highlighting | ✅ |
| 3D | Correct accidental placement, time signature, chord cluster notation rendering | ✅ |
| 3E | Harmonic Understanding panel — collapsible `<details>` with theory text for all 28 layers | ✅ |
| 3F | Expanded circle-of-fifths — inner minor chord ring, POS_TO_PC lookup, pulse animation | ✅ |

**Test coverage**: 48 Vitest unit tests + 54 Cypress E2E tests, all passing.

---

## Phase 1: MVP Architecture (Complete)

### Three Interdependent Workstreams

```
Workstream 1: Learning Architecture
    ↓
    Defines: Layers, puzzles, composition data model
    Delivers: Pedagogical backbone

Workstream 2: Multi-Modal Interaction
    ↓
    Defines: Audio engine, keyboard UI, notation rendering
    Delivers: User interaction layer
    
Workstream 3: Integration & Testing
    ↓
    Integrates: WS1 + WS2 into MVP prototype
    Delivers: Functional product for real-world testing
```

---

## Workstream 1: Learning Architecture

### Objective
Define the pedagogical progression, puzzle types, and how student choices get captured in the final composition.

### Deliverables

**1.1 Kwintessence Layer Documentation**
- Document all 5-7 harmonic layers
- For each layer: harmonic principle + "aha!" moment + complexity
- JSON schema representing the structure

**Example Structure:**
```json
{
  "layer": 1,
  "name": "Foundation",
  "notes": ["root", "5th"],
  "concept": "Understanding the perfect 5th—the stable foundation",
  "puzzleTypes": ["pattern", "logic"],
  "difficulty": 1
}
```

**Timeline**: 2-3 days  
**Owner**: Music theory consultant + developer  
**Acceptance Criteria**:
- All layers documented with clear pedagogical goals
- JSON schema validates against examples
- Musicians/educators confirm progression makes sense

---

**1.2 Puzzle Design for Each Layer**
- Minimum 2-3 puzzle variations per layer
- Each puzzle teaches a specific concept
- Create worked examples for first 2 layers

**Puzzle Types**:
- **Logic**: "Which note completes this harmonic function?"
- **Pattern**: "Match this progression pattern"
- **Constraint**: "Given these limits, build this harmony"
- **Symmetry**: "Mirror this progression"

**Timeline**: 3-5 days  
**Owner**: Music theory consultant  
**Acceptance Criteria**:
- At least 6 complete puzzle specifications
- Clear learning objective for each
- Playable examples for first 2 layers

---

**1.3 Composition Data Model**
- How student choices get recorded
- Final piece representation (MIDI? MusicXML? Custom?)
- Playback mechanism

**Timeline**: 2-3 days  
**Owner**: Developer  
**Acceptance Criteria**:
- Data model chosen and documented
- Example composition file created
- Roundtrip tested (puzzle → data → playback)

---

### Success Metrics for Workstream 1
- ✅ All harmonic layers documented with pedagogy context
- ✅ 6+ playable puzzle examples
- ✅ Composition data model chosen and validated
- ✅ Music theory consultant signs off on pedagogical soundness

---

## Workstream 2: Multi-Modal Interaction

### Objective
Build the three simultaneous representation channels (audio + keyboard + notation) and ensure perfect synchronization.

### Deliverables

**2.1 Audio Engine**
- Chord playback with natural timbre (not synthetic-sounding)
- Support for all interval/chord types in curriculum
- Responsive (sub-100ms latency)

**Technology Choice**: Tone.js recommended
- Good Web Audio abstractions
- Built-in sampler support
- Large community

**Timeline**: 3-4 days  
**Owner**: Developer (audio focus)  
**Acceptance Criteria**:
- Root+5th plays cleanly
- Adding 3rd → chord sounds natural
- C major chord recognizable as "correct"
- No noticeable lag

---

**2.2 Piano Keyboard UI Component**
- Interactive 88-key (or smaller) virtual piano
- Visual feedback for pressed keys
- Support both mouse/touch AND MIDI hardware input
- Responsive, fluid interaction

**Timeline**: 2-3 days  
**Owner**: Frontend developer  
**Acceptance Criteria**:
- Click/tap to play notes works smoothly
- Visual highlight on pressed keys
- MIDI keyboard input recognized
- No stuttering or lag under normal use

---

**2.3 Score Notation Display**
- Display same notes as both keyboard AND staff notation
- Single source of truth (notes) → all three channels update
- Support treble/bass clef options
- Real-time updates on interaction

**Technology Choice**: Vexflow recommended
- SVG rendering
- Good note handling
- Customizable appearance

**Timeline**: 3-4 days  
**Owner**: Developer + music theory input  
**Acceptance Criteria**:
- Notes display correctly on staff
- Keyboard and staff stay in sync
- Can switch between treble/bass clef
- Updates instantly on note changes

---

**2.4 Real-Time Synchronization**
- When one representation updates, all three update simultaneously
- No perceptible lag between audio, keyboard, notation
- Tested under stress conditions

**Timeline**: 2-3 days  
**Owner**: Developer  
**Acceptance Criteria**:
- Audio + keyboard + notation update within 50ms
- No UI jank or reflow issues
- Works on older devices smoothly

---

### Success Metrics for Workstream 2
- ✅ Audio quality feels natural and responsive
- ✅ Keyboard interaction is fluid (no lag)
- ✅ Notation displays and updates correctly
- ✅ All three channels perfectly synchronized
- ✅ Works on mobile and desktop

---

## Workstream 3: MVP Integration & Testing

### Objective
Wire everything together and test the complete concept with musicians.

### Deliverables

**3.1 MVP Prototype Assembly**
- Integrate WS1 pedagogy into WS2 interaction
- Single learning path (one piece to compose)
- All Kwintessence layers included
- Core loop: Solve puzzle → Audio feedback → See on keyboard + notation

**Timeline**: 2-3 days  
**Owner**: Full development team  
**Acceptance Criteria**:
- Complete flow: start to finish works
- No crashes or major bugs
- Rough UI acceptable for testing
- One piece is fully composable

---

**3.2 Internal Musician Testing**
- Test with 3-5 musicians (mix of skill levels)
- Observations:
  - Does puzzle approach make intuitive sense?
  - Does audio feedback teach?
  - What confuses or breaks?
  - How does it *feel* emotionally?

**Test Protocol**:
- 20-30 minute session per musician
- Encourage thinking out loud
- Observe without guiding
- Debrief: "What worked? What didn't?"

**Timeline**: 2-3 days  
**Owner**: UX designer + music theory consultant

**Acceptance Criteria**:
- At least 3 complete test sessions conducted
- Feedback documented and triaged
- Critical issues identified and logged

---

**3.3 Feedback Triage & Prioritization**
- Categorize feedback: critical issues, design improvements, nice-to-haves
- Create action items for next iteration or Phase 2

**Timeline**: 1 day  
**Owner**: Product lead + team

---

### Success Metrics for Workstream 3
- ✅ MVP prototype runs from start to finish
- ✅ Core loop (puzzle → feedback) works smoothly
- ✅ Real musicians tested and provided feedback
- ✅ Critical issues identified and prioritized
- ✅ Product team has clear direction for next steps

---

## Overall Phase 1 Timeline

### Week 1-2: Architecture + Interaction
- **WS1**: Layer definition + puzzle design (3-5 days)
- **WS1**: Data model finalized (2-3 days)
- **WS2**: Audio engine (3-4 days, parallel)
- **WS2**: Keyboard UI (2-3 days)
- **WS2**: Notation rendering (3-4 days)

### Week 3-4: Integration + Testing
- **WS2**: Synchronization (2-3 days)
- **WS3**: MVP assembly (2-3 days)
- **WS3**: Internal testing (2-3 days)
- **WS3**: Feedback triage (1 day)

**Total**: 4-5 weeks for functional MVP

---

## Team Requirements

### Core Team (MVP)

**Music Theory Consultant** (0.5 FTE)
- Validate pedagogical soundness of puzzles
- Ensure Kwintessence progression is respected
- Guide audio/notation feedback design
- Conduct internal musician testing

**Full-Stack Developer** (1.0 FTE)
- Lead architecture and integration
- Audio engine implementation
- Keyboard + notation components
- Synchronization layer

**UX Designer** (0.5 FTE)
- Create calm, intuitive interface
- Interaction design for puzzles
- Visual hierarchy and feedback
- Accessibility considerations

### Advisors (On-call)
- Product owner (vision, priority calls)
- Musician/educator (early user perspective)

---

## Technology Stack (Proposed)

### Frontend
- **Framework**: React or Vue
- **Build**: Vite (fast, modern)
- **Styling**: Tailwind CSS (utilities for clean UI)

### Audio
- **Library**: Tone.js or Web Audio API
- **Samples**: Freepats or similar for natural sound

### Notation
- **Library**: Vexflow or Opensheetmusic.js
- **Alternative**: Custom renderer if needed

### Data & Storage
- **Local Storage**: Browser localStorage for now
- **Composition Format**: JSON or MIDI
- **State Management**: Zustand or Redux (keep it simple)

### Development Environment
- **Node.js**: v18+
- **Package Manager**: npm or pnpm
- **Git**: GitHub for version control

---

## Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Audio latency issues | Core experience feels broken | Choose proven library (Tone.js), test early |
| Notation rendering complexity | Dev time overruns | Use established library (Vexflow), hire expert if needed |
| Puzzle design doesn't teach effectively | MVP fails pedagogically | Music theory consultant validates continuously |
| Synchronization bugs | Confusing UX | Build sync layer early, test relentlessly |
| Scope creep during dev | Timeline slips | Ruthlessly cut Phase 2 features, MVP only |

---

## Definition of "MVP Complete"

✅ **Functional**: One complete composition (5+ layers) is playable from start to finish  
✅ **Sonic**: Audio engine produces clear, natural-sounding chords  
✅ **Visual**: Keyboard + notation displays correctly and updates in real-time  
✅ **Pedagogical**: Tested with musicians; puzzle approach makes sense and teaches  
✅ **Intuitive**: No external documentation needed; users understand flow  
✅ **Bug-Free**: No crashes on normal usage; identified issues are non-blocking  

---

## Next Steps (Immediate)

1. **Finalize team** — Confirm music theory consultant, developer, designer availability
2. **Set up dev environment** — Git repo, initial project structure, CI/CD (if desired)
3. **Kick off WS1** — Begin layer documentation + puzzle design in parallel with WS2
4. **Plan internal testing** — Recruit 3-5 musicians for Week 3-4 user testing

---

**Phase 1 Owner**: [Name TBD]  
**Last Updated**: April 15, 2026  
**Status**: Active Development


---

## Current Status

### WS1 - Learning Architecture: ✅ Complete
- **WS1-1.1 Layer Documentation**: ✅ Complete
- **WS1-1.2 Puzzle Design**: ✅ Complete
- **WS1-1.3 Data Model & Persistence**: ✅ Complete (2026-04-14)
  - All 3 entities (Composition, Layer, Note), PostgreSQL EF Core, MIDI export
- **WS1-1.4 REST API Endpoints**: ✅ Complete (2026-04-14)
  - Full CRUD, layer management, MIDI/JSON export, 31 unit + integration tests

### WS2 - Multi-Modal Interaction: ✅ Complete
- **WS2-2.1 Audio Engine**: ✅ Complete — Web Audio API, triangle + harmonic oscillator, ADSR envelope
- **WS2-2.2 Keyboard UI**: ✅ Complete — interactive SVG piano (MIDI 48–72), click/MIDI input
- **WS2-2.3 Notation Display**: ✅ Complete — custom SVG staff renderer, treble/bass clef, ledger lines
- **WS2-2.4 Real-Time Sync**: ✅ Complete — piano, notation, and playback update from a single MIDI state
  - Also: MIDI hardware input (`midi.js`), chord playback (`playback.js`), puzzle engine (`puzzle-engine.js`)

### WS3 - Integration & Testing: ✅ Complete
- **WS3-3.1 MVP Assembly**: ✅ Complete (2026-04-15)
  - Full puzzle flow wired end-to-end: home → create → puzzle → all 7 layers → completion panel
  - Home page (`index.html` + `home.js`): create and resume composition flows
  - Puzzle page (`puzzle.html` + `puzzle.js`): layer prompts, piano, notation, feedback, MIDI input, playback
  - Dashboard (`dashboard.html`) and status page (`status.html`) operational
  - 65 tests total: 31 backend (xUnit) + 34 frontend (Cypress E2E), all passing
  - Azure Container Apps infra + CI/CD pipeline deployed
- **WS3-3.2 Internal Musician Testing**: ✅ Complete (2026-04-15)
  - Mix of skill levels tested (paired sessions, all 7 layers)
  - Core loop validated: testers understood the concept and want to return
  - Feedback documented (see Phase 2 backlog below)
- **WS3-3.3 Feedback Triage**: ✅ Complete (2026-04-15)
  - 5 items identified and prioritized into Phase 2 backlog

---

## Phase 1 Complete ✅

**Completed**: April 15, 2026  
**Tests**: 65 passing (31 backend + 34 Cypress E2E)  
**Result**: MVP validated with real musicians. Core puzzle concept works. Two UX gaps (piano fidelity, difficulty differentiation) and three feature gaps identified for Phase 2.

---

## Phase 2 Backlog

Derived from WS3-3.2 musician testing (April 15, 2026). Prioritized by impact on the stated failure modes: *task clarity* and *UI discoverability*.

### ✅ Priority 1 — Difficulty Differentiation *(complete — PR #13, April 15 2026)*
**Problem**: Beginner/Intermediate/Advanced selection had no effect on the puzzle experience. Testers noticed.  
**Solution**: `getPuzzleLayers(difficulty)` factory in `puzzle-engine.js`; `puzzle.js` reads `composition.difficulty` from the API response and threads it through all engine calls.
- **Beginner**: verbose prompts, hint always visible (no Show Answer button), C4-range targets
- **Intermediate**: concise prompts, hint on request only, unchanged target notes
- **Advanced**: minimal prompts, bass voicing starting at C3 (MIDI 48), open-position spread
- Cypress tests: 34 → 41 (7 new difficulty-specific tests)

### ✅ Priority 2 — 88-Key Piano with Zoom/Pan *(complete — PR #15, April 15 2026)*
**Problem**: Current 25-key keyboard (MIDI 48–72) doesn't resemble a real piano; musicians felt disoriented.  
**Solution**: Full 88-key keyboard (MIDI 21–108) with horizontal scroll viewport, zoom-in/zoom-out buttons, absolute positioning of keys, and auto-scroll to the target note on each layer advance.
- Layer 5 also renamed from "The Ninth" to "The Secunde" in all code and spec documents
- Cypress tests: 29 new puzzle-flow tests including 5 piano/zoom tests

### ✅ Priority 3 — Improved Piano Visual *(complete — resolved in Priority 2)*
**Problem**: Key proportions and labeling feel abstract.  
**Solution**: Authentic black/white key proportions via absolute positioning, note name labels on white keys, subtle border-radius on key bottoms. Resolved as part of Priority 2 piano rewrite.

### ✅ Priority 4 — Arpeggio Playback *(complete — PR #16, April 15 2026)*
**Problem**: "Play Everything So Far" plays all notes as a simultaneous chord — not how harmony is typically experienced.  
**Solution**: `playArpeggio(composition, bpm)` in `playback.js` plays one note per completed layer in order, spaced by one beat (90% staccato). BPM slider (40–160, default 72) added to the piano toolbar with live label.
- Cypress tests: 4 new arpeggio tempo tests

### ✅ Priority 5 — Circle of Fifths Reference *(complete — PR #17, April 15 2026)*
**Problem**: Testers lacked context for *why* the notes were chosen in this order.  
**Solution**: Inline SVG circle-of-fifths diagram at the bottom of the puzzle card. Root (C) shown with an accent ring; current layer's target note filled accent-colour; dashed line connects root to target. Updates on every layer advance.
- Cypress tests: 4 new circle-of-fifths tests

---

## Phase 2 Complete ✅

**Completed**: April 15, 2026  
**Tests**: 54 Cypress + 36 backend passing (90 total)  
**Result**: All five Phase 2 priorities shipped and merged to main. Full 88-key piano, arpeggio playback, and music-theory context (circle of fifths) delivered.

---

## Latest Commits

- **bc86553**: Initial spec baseline
- **WS1 complete**: Data model + persistence + MIDI export + REST API (31 tests)
- **WS2 complete**: Audio engine, piano keyboard, notation renderer, real-time sync, puzzle engine
- **WS3 complete**: Home flow Cypress E2E tests (9 tests), Azure infrastructure, CI/CD pipeline, musician testing
- **PR #12**: Layer name alignment + puzzle analytics recording (33 backend tests)
- **PR #13**: Difficulty-aware puzzle layers — beginner/intermediate/advanced (41 Cypress tests)
- **PR #14**: GET `/api/compositions/{id}/analytics` endpoint (36 backend tests)
- **PR #15**: 88-key piano with zoom/pan + auto-scroll + layer 5 rename (54 Cypress tests)
- **PR #16**: Arpeggio playback with BPM slider (54 Cypress tests)
- **PR #17**: Circle-of-fifths SVG widget (54 Cypress tests)
