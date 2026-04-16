# KwintBaseHarmony Frontend

ASP.NET Core static frontend for KwintBaseHarmony, modeled after the `NoteStreamApp` approach from `dapr-workflow-concerto`.

## Setup

```bash
dotnet run --no-launch-profile --urls http://localhost:5051
```

The frontend serves static files from `wwwroot` on `http://localhost:5051` and talks to the backend API on `http://localhost:5000`.

## Current Interaction Surface

The frontend provides a full puzzle-based harmony learning experience:

- **Dashboard** (`index.html`): start a new composition or resume an existing one
- **Puzzle page** (`puzzle.html`): step through 7 harmony layers with 4 difficulty modes
  - Beginner, Intermediate, Chords, and Advanced difficulties
  - 88-key interactive piano with zoom and scroll
  - Root-note transposition (7 root options, all layers shift accordingly)
  - Circle-of-fifths widget with major outer ring and minor inner ring
  - Real-time notation rendering (treble/bass clef, chord clusters)
  - Audio preview and arpeggio playback with adjustable tempo
  - Collapsible Harmonic Understanding panel with theory explanations per layer
  - Hint system (auto-hint for beginners, on-demand for others)
  - Show Answer with highlighted piano key for single notes, chord key highlighting for chords
- **Studio** (`studio.html`): free composition editor with virtual piano, notation preview, Web MIDI input, JSON import/export, and MIDI file export
- **Unit tests** (Vitest): 48 tests across music, puzzle-engine, notation, circle-of-fifths modules
- **E2E tests** (Cypress): 54 tests across home, puzzle, studio composition, and studio interaction flows

## Cypress E2E Tests

Frontend end-to-end tests live alongside the static app and use Cypress with mocked backend responses so they can validate the browser flow without requiring the API to be running.

```bash
npm install
npm run test:e2e
```

Useful scripts:

```bash
npm run cy:open       # interactive Cypress runner
npm run cy:run        # headless Cypress run
npm run test:unit     # Vitest unit tests (48 tests)
npm run dev           # start the ASP.NET Core frontend host
```

`npm run test:e2e` uses a local Node runner (`scripts/run-cypress.js`) that starts the frontend host, waits for it to respond, runs Cypress headlessly, and then shuts the host down again.

## Project Structure

```
Program.cs                              # Static file host and /health endpoint
KwintBaseHarmony.Frontend.csproj       # Frontend project file
package.json                           # npm scripts and Vitest/Cypress deps
cypress.config.js                      # Cypress configuration
wwwroot/
├── index.html                         # Dashboard: start/resume composition
├── puzzle.html                        # Puzzle page: harmony learning
├── studio.html                        # Studio: free composition editor
├── styles.css                         # Shared styles
├── app.js                             # Dashboard JS
├── puzzle.js                          # Puzzle page logic
└── scripts/
    ├── audio.js                       # Web Audio API note preview
    ├── circle-of-fifths.js            # SVG circle of fifths (major + minor rings)
    ├── midi.js                        # Web MIDI input
    ├── music.js                       # MIDI/interval utilities, LAYER_COUNT constant
    ├── notation.js                    # ABC.js notation rendering
    ├── piano.js                       # 88-key interactive piano with zoom
    ├── playback.js                    # Arpeggio and layer playback
    └── puzzle-engine.js               # Puzzle layer definitions (4 difficulties × 7 layers)
    
cypress/
├── e2e/
│   ├── home-flows.cy.js               # Dashboard flow tests (9 tests)
│   ├── puzzle-flows.cy.js             # Puzzle page tests (38 tests)
│   ├── studio-composition-flows.cy.js # Studio composition tests (4 tests)
│   └── studio-interactions.cy.js     # Studio interaction tests (3 tests)
└── support/
    └── e2e.js                         # Cypress support entrypoint
tests/
└── unit/
    ├── music.test.js                  # Music utility tests
    ├── notation.test.js               # Notation rendering tests
    ├── puzzle-engine.test.js          # Puzzle engine + difficulty mode tests
    └── circle-of-fifths.test.js       # Circle of fifths widget tests
```
