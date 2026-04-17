---
title: 'Phase 4B: Branching Style Choices'
type: 'feature'
created: '2026-04-17'
status: 'planned'
context: ['WS3-3.1', 'Phase 3', 'Phase 4A']
depends_on: ['Phase 4A']
---

# Phase 4B: Branching Style Choices

## Overview

Every composition currently follows the same 7-layer structure in the same C major (or transposed) scale. Phase 4B adds **style presets** — Jazz, Classical, and Blues — each altering the target notes for selected layers to teach style-specific harmonic devices.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** All compositions are structurally identical regardless of the student's musical interest. A jazz enthusiast and a classical student receive the same harmonic exercise. The "branching composition" idea from the original brainstorm (Idea #3) remains unimplemented.

**Approach:** Add a `style` field to `Composition` (default `"classical"`). The home page creation form gains a style picker. The puzzle engine selects layer definitions from a style-specific table, introducing characteristic intervals per style:

| Style | Harmonic Signature | Layer Changes |
|-------|-------------------|---------------|
| **Classical** | Diatonic major — root, 5th, 3rd, maj7, 2nd, 6th, octave | Unchanged (current default) |
| **Jazz** | Extended harmony — adds ♭7 (dominant 7th) instead of maj7; 9th instead of 2nd | Layer 4 target = B♭ (MIDI 70 in C); Layer 5 target = D (MIDI 62) stays same but prompt/explanation reference jazz extensions |
| **Blues** | Pentatonic + blue note — uses ♭3, ♭7, and ♭5 (tritone) as the characteristic colour | Layers 3, 4, and 5 use E♭ (MIDI 63), B♭ (MIDI 70), G♭ (MIDI 66) respectively in C |

## Boundaries & Constraints

**Always:**
- `style` values: `"classical"`, `"jazz"`, `"blues"`.
- `style` is set at composition creation and cannot be changed afterwards.
- Layer prompts and explanations in the puzzle engine are style-aware (jazz prompts use jazz vocabulary, blues prompts reference the 12-bar blues tradition).
- Root transposition applies to style-specific target MIDIs too (same `transposeLayers` offset logic).
- All difficulties (beginner/intermediate/advanced/chords) are available for all styles.
- The Harmonic Understanding panel (`<details>`) updates its theory text to be style-aware.
- The circle-of-fifths widget highlights are not changed (phase 4B does not modify that component).

**Never:**
- Do not alter the number of layers (still 7 per movement).
- Do not hide style-specific layers behind a separate unlock mechanism.
- Do not require Phase 4A movements to use the same style (each movement inherits style from movement 1).

## Data Model Changes

### `Composition` model addition

```csharp
/// Style preset: "classical", "jazz", or "blues".
[Required]
[StringLength(50)]
public string Style { get; set; } = "classical";
```

### New migration: `20260417000001_AddStyle`

Adds `Style VARCHAR(50) NOT NULL DEFAULT 'classical'` to `Compositions`.

## API

### POST `/api/compositions` — updated request

```json
{
  "studentId": "Ada",
  "title": "Blues Study",
  "difficulty": "intermediate",
  "style": "blues"
}
```

Field is optional; defaults to `"classical"` if absent. `422` if supplied value is not one of the three allowed strings.

### `CompositionResponse` — new field

```json
{ ..., "style": "blues" }
```

## Frontend Changes

### `index.html` — style picker on creation form

```html
<label>
  Style
  <select id="style-input" name="style">
    <option value="classical">Classical</option>
    <option value="jazz">Jazz</option>
    <option value="blues">Blues</option>
  </select>
</label>
```

### `home.js` — pass `style` to `POST /api/compositions`

### `puzzle-engine.js` — style-specific layer tables

Each difficulty already has a `layersByDifficulty` object. The engine gains a `layersByStyle` outer map:

```js
export const layersByStyle = {
  classical: layersByDifficulty,  // existing tables, unchanged
  jazz: { beginner: [...], intermediate: [...], advanced: [...], chords: [...] },
  blues: { beginner: [...], intermediate: [...], advanced: [...], chords: [...] }
};
```

`getPuzzleLayers(difficulty, style = 'classical')` selects from this outer map.

### `puzzle.js` — pass `composition.style` to `getPuzzleLayers`

## Layer Definitions — Jazz (C root)

| Layer | Name | Target | Note | Jazz rationale |
|-------|------|--------|------|----------------|
| 1 | Foundation | C4 (60) | Root — tonal centre same as classical |
| 2 | The Fifth | G4 (67) | Perfect fifth unchanged |
| 3 | The Third | E4 (64) | Major third — retained; jazz uses major and minor triads |
| 4 | The Dominant Seventh | B♭4 (70) | **Changed from B (71)** — dominant 7th defines the jazz sound |
| 5 | The Ninth | D4 (62) | Major 9th extension — same note, jazz framing |
| 6 | The Sixth | A4 (69) | Added 6th — same note, jazz framing |
| 7 | Resolution | C5 (72) | Octave resolution unchanged |

## Layer Definitions — Blues (C root)

| Layer | Name | Target | Note | Blues rationale |
|-------|------|--------|------|----------------|
| 1 | Foundation | C4 (60) | Root unchanged |
| 2 | The Fifth | G4 (67) | Fifth unchanged |
| 3 | The Minor Third | E♭4 (63) | **Changed from E (64)** — the minor 3rd over major root = blues colour |
| 4 | The Flat Seven | B♭4 (70) | **Changed from B (71)** — 12-bar blues dominant 7th |
| 5 | The Blue Note | G♭4 (66) | **Changed from D (62)** — the tritone / blue note, the defining dissonance |
| 6 | The Sixth | A4 (69) | Sixth unchanged |
| 7 | Resolution | C5 (72) | Resolution unchanged |

## Tasks & Acceptance

### Backend

- [ ] Add `Style` property to `Composition.cs` with validation set `{"classical", "jazz", "blues"}`
- [ ] New migration `20260417000001_AddStyle`
- [ ] `CreateCompositionAsync` accepts and persists `style`
- [ ] `CompositionResponse` includes `style`
- [ ] `422` when invalid style posted
- [ ] Test: `CreateComposition_WithJazzStyle_PersistsStyle`
- [ ] Test: `CreateComposition_WithInvalidStyle_Returns422`
- [ ] Test: `CompositionResponse_IncludesStyle`

### Frontend

- [ ] `index.html`: style picker in creation form
- [ ] `home.js`: pass `style` in POST body
- [ ] `puzzle-engine.js`: jazz + blues layer tables for all four difficulty variants; `getPuzzleLayers(difficulty, style)` signature update
- [ ] `puzzle.js`: pass `composition.style` to `getPuzzleLayers`
- [ ] `styles.css`: optional style badge on puzzle card header (`.style-badge.jazz`, `.style-badge.blues`, `.style-badge.classical`)

### Tests

- [ ] Vitest: `getPuzzleLayers('intermediate', 'jazz')` layer 4 target is MIDI 70
- [ ] Vitest: `getPuzzleLayers('intermediate', 'blues')` layer 3 target is MIDI 63, layer 5 is MIDI 66
- [ ] Cypress: create a jazz composition, verify layer 4 prompt references "dominant seventh"
- [ ] Cypress: create a blues composition, verify layer 3 prompt references "minor third" or "blue"

## Acceptance Criteria

- Given I open the home page, when I look at the creation form, then I see a Style dropdown with Classical, Jazz, and Blues options.
- Given I create a Jazz composition and reach layer 4, then the target note is B♭ (MIDI 70) and the prompt mentions "dominant seventh."
- Given I create a Blues composition and reach layer 3, then the target note is E♭ (MIDI 63) and the prompt mentions "minor third" or "blues."
- Given I use root transposition on a Jazz composition, then all jazz target notes transpose by the same offset as classical notes do.
- Given I POST a composition with `style: "reggae"`, then I receive a 422 response.

</frozen-after-approval>

## Code Map

- `src/backend/Models/Composition.cs` — Add `Style`
- `src/backend/Migrations/20260417000001_AddStyle.cs` — DB migration
- `src/backend/Services/CompositionService.cs` — persist/return `style`
- `src/frontend/wwwroot/index.html` — style picker
- `src/frontend/wwwroot/home.js` — pass style in POST
- `src/frontend/wwwroot/scripts/puzzle-engine.js` — jazz + blues layer tables
- `src/frontend/wwwroot/puzzle.js` — thread style into `getPuzzleLayers`
- `src/frontend/wwwroot/styles.css` — style badge
- `tests/CompositionEndpointsTests.cs` — style validation tests
- `src/frontend/tests/puzzle-engine.test.js` — style-specific target MIDI tests
- `src/frontend/cypress/e2e/style-presets.cy.js` — jazz/blues Cypress tests
