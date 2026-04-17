---
title: 'Phase 4A: Modular Compositions & Puzzle Type Variety'
type: 'feature'
created: '2026-04-17'
status: 'approved'
context: ['WS1-1.3', 'WS1-1.4', 'WS3-3.1', 'Phase 3']
---

# Phase 4A: Modular Compositions & Puzzle Type Variety

## Overview

When a student completes all 7 layers of a composition they receive a completion panel. Currently that is the end of the experience. Phase 4A extends the journey: the student can continue into a **second** and **third movement**, each using a different puzzle interaction style. Three movements compose a full piece. The home page groups movements and allows resumption of any movement in the chain.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** After completing all 7 layers the experience ends. There is no continuity between sessions, no sense of a "full piece," and the only way to get more content is to start a brand-new unrelated composition.

**Approach:** Introduce the concept of "movements." A composition gains `movementNumber` (1–3) and `parentCompositionId` (self-referencing FK, null for movement 1). Completing a movement unlocks a "Continue to Movement N+1" button. Each movement uses a distinct puzzle interaction type so the student encounters three different ways of engaging with the same harmonic material:

| Movement | Puzzle Type | Mechanic |
|----------|-------------|----------|
| 1 | **Note Selection** (existing) | Find and click the target note on the piano keyboard |
| 2 | **Chord Building** (existing `chords` layers) | Select all target notes simultaneously and submit the chord |
| 3 | **Multiple Choice** | Choose the correct note name from four labelled buttons; no piano required |

The root note chosen in movement 1 is inherited by movements 2 and 3 — all three movements explore the same tonal centre.

## Boundaries & Constraints

**Always:**
- `movementNumber` is 1, 2, or 3 (backend validates).
- `parentCompositionId` is null for movement 1; points to the movement-1 composition ID for movements 2 and 3.
- Movement chain is identified by the movement-1 composition (root of the chain).
- Creating movement N+1 requires movement N to be 100% complete (`CompletionPercentage == 100`).
- Movement 2 inherits `rootMidi`, `studentId`, and `title` from movement 1 (title gets " — II" appended).
- Movement 3 inherits from movement 1 (title gets " — III" appended).
- Multiple-choice puzzle type presents exactly 4 options: the correct note name + 3 plausible distractors (adjacent semitone names in the scale).
- `difficulty` on movement 2 and 3 is inherited from movement 1 (determines prompt verbosity, not the puzzle mechanic, which is fixed per movement).
- The piano keyboard is **hidden** on movement 3 (multiple-choice only); the notation display remains visible.
- All existing movement-1 tests must continue to pass unchanged.

**Never:**
- Do not add time pressure, scoring, or streaks.
- Do not allow creating movement 2 while movement 1 is incomplete.
- Do not allow more than 3 movements per chain.

## Data Model Changes

### `Composition` model additions

```csharp
/// Movement number within a piece: 1 = first, 2 = second, 3 = third.
[Required]
[Range(1, 3)]
public int MovementNumber { get; set; } = 1;

/// Null for movement 1; set to the movement-1 Composition.Id for movements 2 and 3.
public Guid? ParentCompositionId { get; set; }

/// Navigation property to the parent composition.
public Composition? ParentComposition { get; set; }
```

### New migration: `20260417000000_AddMovements`

Adds `MovementNumber INT NOT NULL DEFAULT 1` and `ParentCompositionId UUID NULL` (FK self-reference) to `Compositions`.

## API

### POST `/api/compositions/{parentId}/movements`

Create the next movement in the chain.

**Conditions:** Returns `409 Conflict` if movement 1 is not 100% complete, or if a movement 3 already exists, or if `{parentId}` is not a movement-1 composition.

**Request:** no body required (all data inherited from parent).

**Response `201 Created`:**
```json
{
  "id": "...",
  "studentId": "...",
  "title": "Warmup in C — II",
  "difficulty": "beginner",
  "movementNumber": 2,
  "parentCompositionId": "...",
  "completionPercentage": 0,
  "rootMidi": 60,
  "layers": [ /* 7 fresh layers */ ]
}
```

### GET `/api/compositions/{id}/movements`

Return all compositions in the movement chain identified by compostion `{id}` (which may be any movement in the chain).

**Response `200 OK`:**
```json
[
  { "id": "...", "movementNumber": 1, "completionPercentage": 100, "title": "Warmup in C", ... },
  { "id": "...", "movementNumber": 2, "completionPercentage": 57, "title": "Warmup in C — II", ... }
]
```

### Existing endpoints

All existing endpoints unchanged. `CompositionResponse` gains `movementNumber` and `parentCompositionId` fields.

## Frontend Changes

### `puzzle-engine.js` — Multiple-Choice Puzzle Type

New export:

```js
export function getMultipleChoiceOptions(layerNumber, rootMidi) {
  // Returns an array of 4 { label: string, midi: number, isCorrect: bool }
  // Correct note derived from transposeLayers(rootMidi)[layerNumber-1].targetMidi
  // Three distractors: ±1 and ±2 semitones from correct (deduplicated, in random order)
}
```

### `puzzle.html`

- New `<div id="multiple-choice-options" class="multiple-choice-options hidden">` block containing four `<button class="mc-option-btn">` elements.
- Piano keyboard and piano toolbar wrapped in `<div id="piano-section">`. Hidden during movement 3.
- New "Continue to Movement N+1 →" button in the completion panel.

### `puzzle.js`

- On load, detect `movementNumber` from `composition.movementNumber`.
- Movement 1: existing note-selection flow (unchanged).
- Movement 2: existing chord-building flow (use `chords` layer definitions, `isCorrectChord`).
- Movement 3: render `getMultipleChoiceOptions()` into `#multiple-choice-options`; clicking a button validates without using the piano.
- Completion panel "Continue" button: calls `POST /api/compositions/{id}/movements`, navigates to new movement's puzzle page.
- Completion panel "Continue" button is hidden if `movementNumber === 3` or if parent was not movement 1.

### `home.js` / `index.html`

- `GET /api/compositions/{id}/movements` called for each composition in the lookup result to detect chains.
- Multi-movement compositions rendered as a group: heading shows title (without suffix), sub-items show "Movement I / II / III" with individual progress.
- "Continue →" button navigates to the lowest-numbered incomplete movement in the chain.

## I/O Details: Multiple-Choice Distractor Logic

Given a target MIDI and root MIDI, candidate pool = all 7 layer target MIDIs (transposed to rootMidi). Distractors are the 3 candidates closest (by absolute semitone distance) to the target that are not the target itself, returned in randomised order. The correct answer is inserted at a random position among the 4 buttons.

## Tasks & Acceptance

### Backend

- [ ] Add `MovementNumber` and `ParentCompositionId` to `Composition.cs`
- [ ] New migration `20260417000000_AddMovements`
- [ ] `POST /api/compositions/{parentId}/movements` endpoint (controller + service method `CreateNextMovementAsync`)
- [ ] `GET /api/compositions/{id}/movements` endpoint (controller + service method `GetMovementChainAsync`)
- [ ] `CompositionResponse` includes `movementNumber` and `parentCompositionId`
- [ ] Validation: 409 if parent not complete; 409 if movement 3 already exists; 409 if parentId is not a movement-1 composition
- [ ] Test: `CreateNextMovement_WhenParentComplete_Returns201WithMovement2`
- [ ] Test: `CreateNextMovement_WhenParentIncomplete_Returns409`
- [ ] Test: `CreateNextMovement_WhenMovement3Exists_Returns409`
- [ ] Test: `GetMovementChain_Returns_AllMovementsInChain`
- [ ] Test: `CompositionResponse_IncludesMovementNumber`

### Frontend

- [ ] `puzzle-engine.js`: `getMultipleChoiceOptions(layerNumber, rootMidi)` export
- [ ] `puzzle.html`: `#multiple-choice-options` block + `#piano-section` wrapper + "Continue to Movement N+1" button in completion panel
- [ ] `puzzle.js`: movement-aware routing (1 → note-select, 2 → chord, 3 → multiple-choice) + "Continue" button wiring
- [ ] `styles.css`: `.multiple-choice-options`, `.mc-option-btn`, `.mc-option-btn.correct`, `.mc-option-btn.incorrect`
- [ ] `home.js` + `index.html`: movement chain grouping in lookup results

### Tests

- [ ] Cypress: `movement-flow.cy.js` — complete movement 1, click Continue, enter movement 2 as chord puzzle
- [ ] Cypress: movement 3 multiple-choice — options rendered, correct click advances layer
- [ ] Cypress: home page shows movement group with both compositions listed
- [ ] Vitest: `getMultipleChoiceOptions` returns 4 options with exactly 1 correct; correct is within candidates

## Acceptance Criteria

- Given a composition with `completionPercentage === 100`, when the completion panel is shown, then "Continue to Movement 2 →" button is visible.
- Given I click "Continue to Movement 2", then a new composition is created and I navigate to puzzle.html for movement 2.
- Given I am on movement 2, when I look at the puzzle, then I see the chord-building interaction (multi-note select + "Submit Chord" button).
- Given I complete movement 2, when I click "Continue to Movement 3", then the multiple-choice puzzle is shown for movement 3.
- Given movement 3 layer prompt is displayed, when I look at the screen, then the piano keyboard is hidden and four note-name buttons are visible.
- Given I click the correct button in movement 3, then the layer advances.
- Given I click an incorrect button in movement 3, then the button flashes red and I can try again.
- Given movement 3 is complete, when the completion panel is shown, then there is no "Continue" button.
- Given I look up a name on the home page that has a movement chain, then I see the compositions grouped together with individual progress.

</frozen-after-approval>

## Code Map

- `src/backend/Models/Composition.cs` — Add `MovementNumber`, `ParentCompositionId`
- `src/backend/Migrations/20260417000000_AddMovements.cs` — DB migration
- `src/backend/Services/CompositionService.cs` — `CreateNextMovementAsync`, `GetMovementChainAsync`
- `src/backend/Services/ICompositionService.cs` — Add method signatures
- `src/backend/Program.cs` — Register new endpoints
- `src/frontend/wwwroot/scripts/puzzle-engine.js` — `getMultipleChoiceOptions`
- `src/frontend/wwwroot/puzzle.html` — `#multiple-choice-options`, `#piano-section`, Continue button
- `src/frontend/wwwroot/puzzle.js` — Movement-aware puzzle routing
- `src/frontend/wwwroot/home.js` — Movement chain grouping
- `src/frontend/wwwroot/index.html` — Home layout for movement groups
- `src/frontend/wwwroot/styles.css` — Multiple-choice button styles
- `tests/CompositionEndpointsTests.cs` — Movement endpoint tests
- `tests/CompositionServiceTests.cs` — `CreateNextMovementAsync` tests
- `src/frontend/cypress/e2e/movement-flow.cy.js` — Movement Cypress tests
- `src/frontend/tests/puzzle-engine.test.js` — `getMultipleChoiceOptions` Vitest tests
