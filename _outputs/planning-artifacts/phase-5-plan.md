# Phase 5 — Song Analysis, Advanced Puzzles & Authentication

**Status**: Planning  
**Target audience**: Student musicians and music educators  
**Builds on**: Phase 4C (analytics dashboard, style presets, modular compositions)

---

## Vision

Phase 5 transforms KwintBaseHarmony from a practice tool into a full harmonic learning platform by adding three interconnected capabilities:

1. **Authentication** — real accounts, persistent progress, multi-device access
2. **Song Analysis** — students analyse existing songs to understand their harmonic structure
3. **Advanced Puzzles** — new puzzle types for deeper harmonic understanding (voice leading, functional harmony, chord substitution)

---

## Epic 1 — Authentication & Accounts

Students currently identify by free-text `studentId`. Phase 5 replaces this with real accounts.

### Goals
- Students register with email + password
- Compositions are tied to the authenticated user
- Multiple students can share a device without cross-contamination
- Educators can see all students in their class

### Stories (draft)
| # | Story | Notes |
|---|-------|-------|
| 1.1 | As a student, I can register with email + password so my progress is saved across devices | Email verification optional for MVP |
| 1.2 | As a student, I can log in and see only my compositions | JWT-based auth |
| 1.3 | As a student, I can log out securely | Token revocation or short expiry |
| 1.4 | As an educator, I can create a class and invite students by code | Class code = 6-char alphanumeric |
| 1.5 | As an educator, I can view all students in my class and their progress | Read-only dashboard |
| 1.6 | As a developer, the API rejects unauthenticated requests to protected endpoints | All `/api/compositions/*` require auth |

### Technical approach
- ASP.NET Core Identity or minimal JWT with `BCrypt.Net`
- Add `UserId` FK to `Composition` (migration)
- HTTPS enforced in production (already in infra)
- Store tokens in `httpOnly` cookie (not localStorage — XSS protection)
- Educator role: simple enum on User entity (`Student | Educator | Admin`)

---

## Epic 2 — Song Analysis (AI Harmonic Recognition)

Students paste a chord chart, hum a melody, or describe a song. The app breaks it into its harmonic layers and creates a composition for them to explore.

### Goals
- Students learn by reverse-engineering real music they love
- Each identified chord/note maps to a layer in the existing puzzle system
- AI guidance explains *why* the harmony works

### Stories (draft)
| # | Story | Notes |
|---|-------|-------|
| 2.1 | As a student, I can paste a chord chart (e.g. "C - G - Am - F") and get a harmonic analysis | Parse common chord notation |
| 2.2 | As a student, the app maps the chord chart to a series of layers I can explore as a puzzle | Reuse existing puzzle engine |
| 2.3 | As a student, I can ask "why does this progression work?" and get a plain-English explanation | OpenAI / Azure OpenAI completion |
| 2.4 | As a student, I can search for a song name and get its common chord progression | Lookup from a curated dataset (not copyright-sensitive) |
| 2.5 | As a student, the analysed song creates a Composition I can practise in the normal puzzle view | Creates a Composition with pre-set layers |

### Technical approach
- New `AnalysisService` — accepts chord string, returns `Composition` entity pre-populated with layers
- AI component: Azure OpenAI (GPT-4o) for harmonic explanation text
- Chord parser: lightweight regex-based parser for Nashville notation + Roman numerals + chord symbols
- No audio upload for MVP (text-only chord input first)
- New endpoint: `POST /api/analysis/chord-chart` → returns `Composition`

---

## Epic 3 — Advanced Puzzle Types

The current puzzle system has three types (note-select, chord, multiple-choice). Phase 5 adds:

### 3A — Voice Leading Puzzle
Students must connect two chords with smooth voice leading (minimal movement per voice).

| # | Story |
|---|-------|
| 3A.1 | As a student, I can see two target chords and must find the smoothest connection between them |
| 3A.2 | The puzzle scores my answer by total semitones moved (lower = better) |
| 3A.3 | The explanation teaches "contrary motion" and "common tones" |

### 3B — Functional Harmony Puzzle
Students identify chord function: Tonic / Subdominant / Dominant.

| # | Story |
|---|-------|
| 3B.1 | As a student, I hear a chord and must classify it (T / S / D) |
| 3B.2 | The puzzle uses playback + notation to help me hear the function |
| 3B.3 | I progress through all diatonic chords in a key |

### 3C — Chord Substitution Puzzle
Students choose a substitute chord that preserves harmonic function.

| # | Story |
|---|-------|
| 3C.1 | As a student, I see a progression with a marked chord I must substitute |
| 3C.2 | I choose from 4 options and hear how each sounds in context |
| 3C.3 | The explanation teaches tritone substitution, relative minor, etc. |

### Technical approach
- New `puzzleType` field on `Layer` entity (`note-select | chord | multiple-choice | voice-leading | functional | substitution`)
- New puzzle type rendering in `puzzle.js` — each type is a self-contained render+validate function
- New entries in `puzzle-layers-data.js` for advanced layer definitions

---

## Phase 5 Milestones

| Milestone | Epics | Description |
|-----------|-------|-------------|
| 5.1 — Auth MVP | Epic 1 (1.1–1.3) | Student login/register, compositions protected |
| 5.2 — Educator View | Epic 1 (1.4–1.6) | Class management, educator dashboard |
| 5.3 — Chord Chart Analysis | Epic 2 (2.1–2.3) | Paste chord chart → get puzzle |
| 5.4 — AI Explanation | Epic 2 (2.3–2.4) | Azure OpenAI harmonic explanation |
| 5.5 — Voice Leading | Epic 3A | First advanced puzzle type |
| 5.6 — Functional + Sub | Epic 3B + 3C | Remaining advanced puzzle types |

**Recommended start**: Milestone 5.1 (Auth MVP) — it is a hard prerequisite for educator features and personalised song analysis.

---

## Open Questions

1. **Auth provider**: Roll our own JWT vs Azure AD B2C vs Auth0? — Own JWT is simplest for MVP; can migrate later.
2. **AI cost**: OpenAI calls per analysis are ~$0.002 each — acceptable if authenticated users only.
3. **Chord dataset**: Where does song lookup data come from? Options: OpenChords, Ultimate Guitar API, curated JSON file.
4. **Advanced puzzles in movements**: Do advanced puzzle types appear in movement 3 only, or are they a separate progression path?
5. **Notation for voice leading**: Does the voice leading puzzle need animated notation to show movement between chords?

---

## Next Steps

Ready to implement? Suggested order:

1. **Auth** (`5.1`): Add `User` entity + migrations + JWT endpoints + protect existing API
2. **Chord parser** (`5.3` first part): Standalone `ChordChartParser` class — no AI needed yet
3. **Voice leading puzzle** (`5.5`): New puzzle type in `puzzle.js` — no backend changes
4. **AI explanation** (`2.3`): Add Azure OpenAI call to analysis endpoint

Say `yes, start with 5.1` or pick a specific milestone to begin.
