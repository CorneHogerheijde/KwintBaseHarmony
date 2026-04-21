# Phase 5 — Authentication, Circle of Fifths Puzzles & Notation

**Last updated**: April 18, 2026  
**Target audience**: Student musicians and music educators  
**Builds on**: Phase 4C (analytics dashboard, style presets, modular compositions)

---

## Milestone Status

| Milestone | Title | Status |
|-----------|-------|--------|
| 5.1 | Auth MVP | ✅ Complete (PR #38) |
| 5.2 | Auth Enforcement | ✅ Complete (PR #39) |
| 5.2b | Social OAuth & User-Linked Compositions | ✅ Complete (PR #49) |
| 5.3 | Circle of Fifths Puzzle Expansion | ⬜ Planned |
| 5.4 | Notation Preview Fix | ⬜ Planned |
| 5.5 | Educator View / Class Management | ⬜ Backlog |
| 5.6 | Song Analysis (Chord Chart Input) | ⬜ Backlog |
| 5.7 | Advanced Puzzle Types (Voice Leading, Functional Harmony) | ⬜ Backlog |

---

## Milestone 5.3 — Circle of Fifths Puzzle Expansion

### Vision

All current puzzles are anchored to C major. This milestone teaches students to play in every key by progressively walking them around the circle of fifths — from C (no accidentals) through sharp keys (G, D, A, E, B, F♯) and flat keys (F, B♭, E♭, A♭, D♭, G♭).

### Theory Foundation

**Circle of fifths structure** (Hoffman Academy reference + standard theory):
- Clockwise = +1 sharp per step: C → G → D → A → E → B → F♯/G♭
- Counter-clockwise = +1 flat per step: C → F → B♭ → E♭ → A♭ → D♭ → G♭
- Sharp rule: the last sharp in a key signature is one half-step below the tonic (e.g. F♯ in G major → G)
- Flat rule: the penultimate flat in a key signature names the key (e.g. B♭ E♭ → B♭ major)
- Every added sharp is the 7th scale degree of the new key
- Every added flat is the 4th scale degree of the new key

**Key table for implementation:**

| Key | Accidentals | Root MIDI | Characteristic layer note |
|-----|------------|-----------|---------------------------|
| C major | — | 60 | E4 (64) |
| G major | F♯ | 67 | F♯4 (66) |
| D major | F♯ C♯ | 62 | C♯4 (61) |
| A major | F♯ C♯ G♯ | 69 | G♯4 (68) |
| E major | F♯ C♯ G♯ D♯ | 64 | D♯4 (63) |
| F major | B♭ | 65 | B♭3 (58) |
| B♭ major | B♭ E♭ | 58 | E♭4 (63) |
| E♭ major | B♭ E♭ A♭ | 63 | A♭3 (56) |
| A♭ major | B♭ E♭ A♭ D♭ | 56 | D♭4 (61) |

### User Stories

| # | Story |
|---|-------|
| 5.3.1 | As a student, I can choose a key (from C to 4 sharps / 4 flats) when creating a composition |
| 5.3.2 | As a student, the puzzle layers show note names with correct accidentals (e.g. "F♯" not "F") |
| 5.3.3 | As a student, I can see the key signature (sharp/flat symbols) rendered at the start of the notation staff |
| 5.3.4 | As a student, I can progress through keys in circle-of-fifths order (C → G → D …) as an educator-guided path |
| 5.3.5 | As a student, the theory panel explains which notes are sharpened/flattened and why |
| 5.3.6 | As a developer, accidentals are stored as part of the keyProfile, not hardcoded per layer |

### Technical Approach

- New `keyProfile` JS module: `{ rootMidi, accidentals: string[], scaleDegreeMidi: number[] }`
- **No new DB column** — `rootMidi` already exists on `Composition`; extend its valid range to all 12 chromatic roots
- Key picker on home page **replaces** the existing root selector (same field, richer label like "G major (1♯)")
- Extend `puzzle-layers-data.js`: layer target MIDI values computed as `baseInterval + rootMidi` (relative to C4=60)
- `puzzle-engine.js`: add `getKeyProfile(rootMidi)` and `transposeLayerToKey(layerDef, rootMidi)` functions
- Notation renderer: render ♯ / ♭ glyphs before note heads on grand staff; draw key signature at start of both staves
- Theory panel: extend existing `<details>` per layer with key-specific explanation

### References
- Hoffman Academy — Circle of Fifths Piano Tutorial: https://www.hoffmanacademy.com/blog/the-circle-of-fifths-piano-tutorial
- Hoffman Academy — All Major Scales guide: https://www.hoffmanacademy.com/blog/major-scales-guide-piano
- Standard MIDI note numbering: C4 = 60, each semitone = 1

---

## Milestone 5.4 — Notation Preview Fix

### Vision

The current notation renderer is octave-unaware: it cannot distinguish C3 from C4, and always uses the treble clef regardless of pitch register. This milestone makes the notation musically accurate.

### User Stories

| # | Story |
|---|-------|
| 5.4.1 | As a student, I can see note names with octave numbers (C4, G♯3) so I know exactly where to play |
| 5.4.2 | As a student, notes below C4 appear on the bass staff and notes at/above C4 appear on the treble staff |
| 5.4.3 | As a student, middle C (MIDI 60) is shown with its ledger line between the two staves |
| 5.4.4 | As a student, chords (multiple simultaneous notes) are rendered correctly on the appropriate staff |
| 5.4.5 | As a developer, there is a single `midiToOctaveLabel(midi)` function used by piano keys, notation, and puzzle hints |

### Technical Approach

- `midiToOctaveLabel(midi)`: `Math.floor(midi / 12) - 1` for octave, `noteNames[midi % 12]` for pitch class
- **Grand staff always rendered**: two staves (treble + bass) drawn for every layer preview
- Notes split at middle C (MIDI 60): ≥60 → treble staff, <60 → bass staff
- **Simultaneous notes supported**: multiple MIDI values on the same layer grouped as a chord on the appropriate staff (or split across both if they span the boundary)
- C4 (MIDI 60) rendered with a ledger line between the staves
- Canvas resized vertically to accommodate both staves; staff/note size reduced slightly (estimated 75–80% of current) to keep the layout compact
- `notation.js` refactored to accept an array of MIDI values per layer rather than a single pitch

---

## Milestone 5.5 — Educator View (Backlog)

Previously labelled "5.2" in the original phase-5 plan. Re-numbered because Auth Enforcement took that slot.

### Stories (draft)
| # | Story |
|---|-------|
| 5.5.1 | As an educator, I can create a class with an invite code |
| 5.5.2 | As a student, I can join a class using the invite code |
| 5.5.3 | As an educator, I can view a read-only dashboard of all students in my class and their completion % |

---

## Milestone 5.6 — Song Analysis / Chord Chart Input (Backlog)

| # | Story |
|---|-------|
| 5.6.1 | As a student, I can paste a chord chart (e.g. "C - G - Am - F") and get a composition to explore |
| 5.6.2 | As a student, I can ask "why does this work?" and receive a plain-English harmonic explanation |

Technical: `AnalysisService` parses chord notation → generates `Composition` with pre-set layers; optional Azure OpenAI explanation text.

---

## Milestone 5.7 — Advanced Puzzle Types (Backlog)

### 5.7A — Voice Leading Puzzle
Students connect two chords with smooth voice leading (minimal semitone movement). Scored by total semitones moved.

### 5.7B — Functional Harmony Puzzle
Students classify chords as Tonic / Subdominant / Dominant and progress through all diatonic chords in a key.

### 5.7C — Chord Substitution Puzzle
Students choose a substitute chord from 4 options and hear how each sounds in context (tritone sub, relative minor, etc.)

---

## Resolved Design Decisions (phase-wide)

1. **Key storage**: Reuse existing `rootMidi` column — no new DB migration. UI derives key label from MIDI root (e.g. 67 → "G major (1♯)").
2. **Key vs. root picker**: Key picker *replaces* the existing root selector on the home page; same underlying field, better pedagogical labelling.
3. **Grand staff**: Always render both treble and bass staves for notation. Notes ≥ MIDI 60 on treble, < 60 on bass. Simultaneous notes supported as chords, split across staves at the middle-C boundary if needed.
4. **Canvas size**: Height increased to fit both staves; note and staff size scaled down (est. 75–80%) to keep layout compact without scrolling.


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
