---
title: 'Phase 4C: Progress & Analytics Dashboard'
type: 'feature'
created: '2026-04-17'
status: 'planned'
context: ['WS1-1.6', 'WS1-1.4', 'Phase 4A']
depends_on: ['Phase 4A']
---

# Phase 4C: Progress & Analytics Dashboard

## Overview

The backend already records `attempts`, `firstTryCorrect`, and `timeSpentMs` per layer (via WS1-1.6). Phase 4C surfaces this data to the student as a personal progress page — a calm, chart-based view showing how they are improving across compositions and movements.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Layer analytics (`attempts`, `firstTryCorrect`, `timeSpentMs`) are persisted but never shown to the student. The data is wasted. After Phase 4A introduces movements, a progress view also gives students a bird's-eye view of their entire piece.

**Approach:** Add a lightweight `progress.html` page reachable from the puzzle completion panel and from the home page footer. The page fetches `GET /api/compositions/{id}/analytics` for each composition in the student's history, and renders:

1. **Per-composition summary card** — title, movement number, completion %, first-try rate, average time per layer.
2. **Layer bar chart** — horizontal bars per layer (1–7), bar length = time spent (ms), colour = first-try (green) vs. retried (amber).
3. **Cross-composition trend** — if multiple compositions exist, a sparkline of first-try rate over time.

No backend changes are required beyond what WS1-1.6 already shipped. This is a purely frontend feature.

## Boundaries & Constraints

**Always:**
- Progress page is `progress.html` — standalone page, not a SPA route.
- Student identity is read from `localStorage` key `kwint_student_id` (same key used by `home.js` to restore the last-used name).
- The page self-navigates to home if `kwint_student_id` is not set.
- Charts are rendered with **Chart.js** (CDN, already permitted by CSP in the frontend dockerfile).
- All times displayed in seconds (not ms) rounded to one decimal.
- If a layer has `timeSpentMs === 0` and `firstTryCorrect === false`, it was skipped — shown as a grey bar with label "Skipped."
- Privacy: no external tracking. All data is fetched from the same API origin.

**Never:**
- Do not expose raw `PuzzleAnswersJson` to the user (parse into human-friendly stats only).
- Do not add competitive features — no leaderboard, no comparison to other students.
- Do not block navigation back to home if analytics API returns an error (graceful fallback to "no data yet").

## API Usage (no changes required)

### GET `/api/compositions?studentId={name}`

Returns list of compositions. Used to enumerate all compositions for the student.

### GET `/api/compositions/{id}/analytics`

Returns:
```json
{
  "compositionId": "...",
  "title": "...",
  "completionPercentage": 100,
  "layers": [
    {
      "layerNumber": 1,
      "name": "Foundation",
      "completed": true,
      "timeSpentMs": 42000,
      "attempts": 2,
      "firstTryCorrect": false
    },
    ...
  ]
}
```

Called once per composition. Results cached in memory for the page session (no re-fetch on tab switch).

## Page Layout

```
┌──────────────────────────────────────────────────────────┐
│  ← Home          Your Progress — Ada                     │
├──────────────────────────────────────────────────────────┤
│  ┌─ Warmup in C ─────────────────────────────────────┐   │
│  │  Movement I · 100% complete                        │   │
│  │  First-try rate: 71%  · Avg time: 38.4s / layer    │   │
│  │                                                    │   │
│  │  Layer 1  ████████████████░░░░ 42.0s  ✓ first try  │   │
│  │  Layer 2  ███████░░░░░░░░░░░░ 18.2s  ↻ retried     │   │
│  │  Layer 3  ░░░░░░░░░░░░░░░░░░ Skipped               │   │
│  │  ...                                               │   │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ First-try rate trend ─────────────────────────────┐   │
│  │  ▁▃▅▇ (sparkline across compositions)             │   │
│  └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## Frontend Changes

### `progress.html` (new file)

Full standalone page with:
- `<header>` with back link and student name heading.
- `<main id="progress-main">` containing a `<div id="composition-cards">` list and a `<canvas id="trend-chart">` sparkline.
- Chart.js loaded from CDN (`<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>`).

### `progress.js` (new file)

- On load: read `kwint_student_id` from localStorage; if absent, redirect to `/`.
- Fetch all compositions for student (`GET /api/compositions?studentId=...`).
- For each composition, fetch analytics.
- Render per-composition card (DOM construction, no framework).
- Render layer bar chart per composition (Chart.js horizontal bar).
- Render trend sparkline if ≥ 2 compositions with analytics.

### `index.html` — add footer link

```html
<a href="/progress.html" class="footer-link">My Progress</a>
```

### `puzzle.html` — add link in completion panel

```html
<a id="progress-link" href="/progress.html" class="secondary-button">View My Progress</a>
```

### `styles.css` — progress page styles

`.progress-card`, `.layer-bar`, `.layer-bar-fill`, `.layer-bar-fill.first-try`, `.layer-bar-fill.retried`, `.layer-bar-fill.skipped`, `.trend-section`.

## Tasks & Acceptance

### Frontend

- [ ] `progress.html` — page scaffold (header, main, canvas)
- [ ] `progress.js` — data fetch, composition card rendering, layer bar chart (Chart.js), trend sparkline
- [ ] `styles.css` — progress page styles
- [ ] `index.html` — "My Progress" footer link
- [ ] `puzzle.html` — "View My Progress" link in completion panel

### Tests

- [ ] Cypress: `progress.cy.js` — complete a composition, navigate to /progress.html, verify composition card appears with correct layer count
- [ ] Cypress: verify first-try layer shown with ✓ indicator; retried layer shown with ↻
- [ ] Cypress: verify skipped layers shown as "Skipped" (grey bar)
- [ ] Cypress: if localStorage has no student id, redirect to /

## Acceptance Criteria

- Given `kwint_student_id` is set in localStorage, when I navigate to `/progress.html`, then I see a heading with my student name and a list of my compositions.
- Given a composition with all 7 layers and analytics recorded, when I view its card, then I see the first-try rate (%) and average time per layer.
- Given a layer was solved on the first try, when I view the bar chart, then its bar is coloured green with a ✓ label.
- Given a layer was retried (attempts > 1), when I view the bar chart, then its bar is coloured amber with a ↻ label.
- Given a layer has `timeSpentMs === 0`, when I view the bar chart, then a grey "Skipped" bar is shown.
- Given I have two or more compositions with analytics, when I view the progress page, then a trend sparkline showing first-try rate over time is rendered.
- Given `kwint_student_id` is absent from localStorage, when I navigate to `/progress.html`, then I am redirected to `/`.

</frozen-after-approval>

## Code Map

- `src/frontend/wwwroot/progress.html` — new standalone page
- `src/frontend/wwwroot/progress.js` — new page script
- `src/frontend/wwwroot/styles.css` — progress styles
- `src/frontend/wwwroot/index.html` — footer link
- `src/frontend/wwwroot/puzzle.html` — completion panel link
- `src/frontend/cypress/e2e/progress.cy.js` — Cypress tests
