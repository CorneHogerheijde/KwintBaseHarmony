# KwintBaseHarmony - Phase 1 Development Plan

## Overview

**Goal**: Build a functional MVP that demonstrates the core "harmony learning through composition puzzles" concept.

**Timeline**: 4-6 weeks  
**Target Users**: Initial testing with 3-5 musicians/music educators

**Success Criteria**:
- ✅ Students can compose a complete musical piece (5+ chord layers)
- ✅ Audio feedback clearly teaches harmonic concepts
- ✅ Multi-modal interaction (audio + keyboard + notation) works smoothly
- ✅ Puzzle-based progression follows Kwintessence structure
- ✅ Zero external pressure/gamification elements

---

## Phase 1: MVP Architecture

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

### Priority 1 — Difficulty Differentiation
**Problem**: Beginner/Intermediate/Advanced selection has no effect on the puzzle experience. Testers noticed.  
**Solution**: Combine level-adaptive prompts/hints AND different target note complexity per level:
- **Beginner**: verbose prompts, explicit hints always visible, simpler intervals
- **Intermediate**: concise prompts, hints on request, standard intervals
- **Advanced**: minimal prompts, no hints, wider interval range across octaves

### Priority 2 — 88-Key Piano with Zoom/Pan
**Problem**: Current 25-key keyboard (MIDI 48–72) doesn't resemble a real piano; musicians felt disoriented.  
**Solution**: Full 88-key keyboard (MIDI 21–108) with horizontal zoom/pan. Viewport focuses on relevant octave per layer, but full range is scrollable.

### Priority 3 — Improved Piano Visual
**Problem**: Key proportions and labeling feel abstract.  
**Solution**: Authentic black/white key proportions, note name labels on white keys (toggleable), slight 3D shadow on press. Likely resolved as part of Priority 2.

### Priority 4 — Arpeggio Playback
**Problem**: "Play Everything So Far" plays all notes as a simultaneous chord — not how harmony is typically experienced.  
**Solution**: Add arpeggio mode: play accumulated notes one by one in layer order, with configurable tempo.

### Priority 5 — Circle of Fifths Reference
**Problem**: Testers lacked context for *why* the notes were chosen in this order.  
**Solution**: Inline circle of fifths diagram that highlights the current layer's note and its relationship to the root. Links the puzzle to music theory.

---

## Latest Commits

- **bc86553**: Initial spec baseline
- **WS1 complete**: Data model + persistence + MIDI export + REST API (31 tests)
- **WS2 complete**: Audio engine, piano keyboard, notation renderer, real-time sync, puzzle engine
- **WS3 complete**: Home flow Cypress E2E tests (9 tests), Azure infrastructure, CI/CD pipeline, musician testing
