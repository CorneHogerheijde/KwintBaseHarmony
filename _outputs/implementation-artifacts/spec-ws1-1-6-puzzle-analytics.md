---
title: 'WS1-1.6: Puzzle Analytics Recording'
type: 'feature'
created: '2026-04-15'
status: 'done'
context: ['WS1-1.3', 'WS1-1.4', 'WS1-1.5']
---

# WS1-1.6: Puzzle Analytics Recording

## Overview

Extend the `/complete` endpoint to accept and persist puzzle analytics — attempt count, first-try correctness, and time spent. This makes the WS3-3.2 musician testing sessions produce real quantitative data, enabling feedback triage in WS3-3.3.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** When a musician completes a layer, the backend receives no information about *how* they solved it. `PuzzleAnswersJson` and `TimeSpentMs` exist in the schema but are never populated. After WS3-3.2 testing sessions we'll have zero quantitative data on difficulty, first-try rates, or time distribution per layer.

**Approach:** Make the `/complete` endpoint accept an optional JSON body `{ attempts, firstTryCorrect, timeSpentMs }`. The service persists `timeSpentMs` to `Layer.TimeSpentMs` and serializes `{ attempts, firstTryCorrect }` into `Layer.PuzzleAnswersJson`. The body is optional — callers that send no body (e.g. "Skip Layer") still work as before.

## Boundaries & Constraints

**Always:**
- Body is optional (null body = skip / show-answer path, analytics zeroed)
- `attempts` must be ≥ 1 if provided
- `timeSpentMs` must be ≥ 0 if provided
- `PuzzleAnswersJson` format: `{"attempts":N,"firstTryCorrect":true|false}`
- No new DB columns or migrations — use existing `TimeSpentMs` and `PuzzleAnswersJson`
- `LayerResponse` exposes `PuzzleAnswersJson` so the frontend can read it back

**Never:**
- Do not store raw user input strings in PuzzleAnswersJson (only structured data)
- Do not make the body required (breaks existing "Skip Layer" call in puzzle.js)

## I/O Spec

### Request
`POST /api/compositions/{id}/layers/{n}/complete`

```json
{ "attempts": 3, "firstTryCorrect": false, "timeSpentMs": 42000 }
```
All fields optional. Omitted = layer completed without analytics (skip/show-answer path).

### Response (unchanged shape, `puzzleAnswersJson` now populated)
```json
{
  "id": "...",
  "layers": [
    {
      "layerNumber": 1,
      "completed": true,
      "timeSpentMs": 42000,
      "puzzleAnswersJson": "{\"attempts\":3,\"firstTryCorrect\":false}",
      ...
    }
  ]
}
```

## Tasks & Acceptance

- [x] Add `CompleteLayerRequest` record (nullable `int? Attempts`, `bool? FirstTryCorrect`, `long? TimeSpentMs`)
- [x] `/complete` endpoint binds optional body; passes values to service
- [x] `CompleteLayerAsync(Guid, int, int?, bool?, long?)` persists analytics
- [x] `ICompositionService` signature updated
- [x] `LayerResponse` includes `PuzzleAnswersJson`
- [x] Existing `CompleteLayer_UpdatesCompletionPercentage` test still passes (null body)
- [x] New test: `CompleteLayer_WithAnalytics_PersistsTimeAndPuzzleAnswers`
- [x] New test: `CompleteLayer_WithoutBody_ZerosAnalytics`

</frozen-after-approval>
