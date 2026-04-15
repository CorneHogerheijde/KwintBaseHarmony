---
title: 'WS3-3.1: Puzzle UI — Layer-Gated Composition Flow'
type: 'feature'
created: '2026-04-15'
status: 'in-progress'
context: ['WS1-1.3', 'WS1-1.4']
---

# WS3-3.1: Puzzle UI — Layer-Gated Composition Flow

## Overview

Wire the pedagogical core loop: student is shown a harmonic concept for the current layer, picks the correct note on the virtual piano, receives audio feedback, and progresses layer-by-layer until the composition is complete.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The existing frontend is a developer dashboard — it lets you create/edit compositions by typing MIDI numbers, but has no teaching interaction. There is no puzzle, no concept guidance, no feedback loop, and no narrative progression.

**Approach:** Add a dedicated puzzle page (`puzzle.html`) reached from the dashboard via a "Start Puzzle" button. Each layer is presented as a theory prompt: show the harmonic concept, let the student pick a note on the virtual piano, validate it against the expected target note, and optionally provide a hint. Completing a layer plays it back and advances to the next.

## Decisions (from product questions)

| Question | Decision |
|----------|----------|
| Puzzle mechanic | Theory prompt: student sees a concept and picks the note that completes it |
| Layer targets | Derived from Kwintessence structure in C major (see layer table below) |
| Completion gate | Must pick correct note OR click "Show Answer" (highlights key) OR "Skip Layer" |
| Audio on complete | **Single layer playback** + separate "Play everything so far" button always visible |
| Routing | "Start Puzzle" button on dashboard (disabled until a composition is loaded) |
| UI on puzzle page | Progress bar, concept text, piano keyboard, notation staff, back link (no activity log) |

## Boundaries & Constraints

**Always:**
- Puzzle page is `puzzle.html` — a standalone page, not a SPA route
- Student gets to puzzle via "Start Puzzle" button on dashboard → navigates with `?id={compositionId}`
- Puzzle page resolves the composition ID from the URL and fetches the full composition from the API
- The first incomplete layer (lowest `layerNumber` where `completed === false`) is presented
- All playback uses the existing Web Audio approach in `audio.js` / new `playback.js`
- "Show Answer" only *highlights* the correct key — student must still click it
- "Skip Layer" calls `POST /api/compositions/{id}/layers/{n}/complete` without adding a note
- "Mark Layer Complete" requires a correct note to be selected first; then adds the note via API and marks complete
- Re-using `piano.js` and `notation.js` directly (same element IDs exist in `puzzle.html`)

**Never:**
- Do not add gamification, scoring, timers, or pressure elements
- Do not auto-advance after a layer — let the student initiate

## The 7 Harmonic Layers

| # | Name | Prompt | Target MIDI | Note |
|---|------|--------|-------------|------|
| 1 | Foundation | Play the root note — C. This is the anchor of your entire harmony. | 60 | C4 |
| 2 | The Fifth | Add the perfect fifth — G. It creates openness and stability above the root. | 67 | G4 |
| 3 | The Third | Complete the triad by adding the third — E. This gives the chord its bright character. | 64 | E4 |
| 4 | The Seventh | Add the major seventh — B. It brings sophistication and luminous tension. | 71 | B4 |
| 5 | The Secunde | Add the secunde — D. The second degree, extending the harmony into a new voice. | 62 | D4 |
| 6 | The Sixth | Add the major sixth — A. It brings warmth and a sense of longing. | 69 | A4 |
| 7 | Resolution | Return to the root — C, one octave higher. Anchor the harmony and complete your composition. | 72 | C5 |

</frozen-after-approval>

## Code Map

- `src/frontend/wwwroot/puzzle.html` — Standalone puzzle page
- `src/frontend/wwwroot/puzzle.js` — Puzzle page orchestration (fetching, state, events)
- `src/frontend/wwwroot/scripts/puzzle-engine.js` — Layer definitions, target note data, validation
- `src/frontend/wwwroot/scripts/playback.js` — Layer sequence player and full-composition chord player
- `src/frontend/wwwroot/index.html` — Add "Start Puzzle" button to Load Composition panel
- `src/frontend/wwwroot/scripts/dom.js` — Export `startPuzzleButton`
- `src/frontend/wwwroot/app.js` — Wire Start Puzzle button + enable/disable on composition load
- `src/frontend/wwwroot/styles.css` — Puzzle page layout + progress bar + hint key highlight

## Tasks & Acceptance

**Execution:**
- [ ] `scripts/puzzle-engine.js` — Define `puzzleLayers` array (7 entries with number, name, prompt, hint, targetMidi); export `isCorrectNote(layerNumber, midi)` and `getFirstIncompleteLayer(composition)`
- [ ] `scripts/playback.js` — Export `playLayer(layer)` (sequence by timingMs) and `playEverythingSoFar(composition)` (all notes simultaneous chord)
- [ ] `puzzle.html` — Puzzle page with: back link, composition title, progress bar, layer prompt card, piano keyboard, notation staff, action buttons (Mark Complete / Show Answer / Skip Layer / Play Layer / Play Everything), completion panel
- [ ] `puzzle.js` — Fetch composition by `?id=` param, find first incomplete layer, wire all interactions, advance on complete, show completion screen when all 7 done
- [ ] `index.html` — Add "Start Puzzle" primary button in Load Composition panel (disabled by default)
- [ ] `scripts/dom.js` — Export `startPuzzleButton`
- [ ] `app.js` — Enable startPuzzleButton when composition loaded; click navigates to `/puzzle.html?id=...`
- [ ] `styles.css` — Puzzle nav, progress bar (`puzzle-progress-bar`, `puzzle-progress-fill`), progress label, puzzle card, hint text, `.is-hint` piano key style, completion panel

**Acceptance Criteria:**
- Given no composition is loaded, when I view the dashboard, then "Start Puzzle" is disabled
- Given a composition is created or loaded, when I click "Start Puzzle", then I navigate to puzzle.html showing the first incomplete layer
- Given I am on the puzzle page, when I click the correct note, then "Mark Layer Complete" becomes enabled
- Given I click an incorrect note, when I look at the action buttons, then "Mark Layer Complete" remains disabled
- Given I click "Show Answer", when I look at the piano, then the correct key is highlighted in amber and the hint text appears
- Given I click "Mark Layer Complete", then the note is added via API, the layer is marked complete, the layer plays back, and the next layer's puzzle is shown
- Given I click "Skip Layer", then the layer is marked complete without a note and the next layer is shown
- Given all 7 layers are complete, when the last layer is submitted, then the completion screen is shown
- Given I am on the completion screen, when I click "Play Full Composition", then all notes play simultaneously as a chord
