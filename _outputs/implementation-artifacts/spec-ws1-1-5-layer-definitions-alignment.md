---
title: 'WS1-1.5: Align Backend Layer Definitions with Kwintessence Canonical Structure'
type: 'feature'
created: '2026-04-15'
status: 'done'
context: ['WS1-1.3', 'WS1-1.4', 'WS3-3.1']
---

# WS1-1.5: Align Backend Layer Definitions with Kwintessence Canonical Structure

## Overview

The backend `CompositionService.GetDefaultLayerName()` and `GetDefaultLayerConcept()` were written with a different layer ordering than what WS3-3.1 (Puzzle UI) codified as the canonical Kwintessence structure. This misalignment means a composition created via the API will have layer labels that don't match what the puzzle page presents.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** When a student's composition is created, each layer gets a default name and concept from the backend. The puzzle page (WS3-3.1) also defines layer names and prompts — but they differ. For example:
- Backend layer 1: "Foundation (Root + 5th)" — implies two notes together
- WS3 layer 1: "Foundation" — the root note alone (one note per layer is the MVP mechanic)

**Approach:** Update `GetDefaultLayerName()` and `GetDefaultLayerConcept()` in `CompositionService` to exactly match the canonical 7-layer Kwintessence table from WS3-3.1, so the data served from the API is consistent with what the puzzle page displays.

## Boundaries & Constraints

**Always:**
- Match the canonical layer table from WS3-3.1 (sole source of truth)
- Layer order 1-7 is fixed: Root → Fifth → Third → Seventh → Ninth → Sixth → Resolution
- Names and concepts must survive a composition roundtrip (JSON export/import)
- No schema or migration changes needed — these are default string values only

**Never:**
- Do not change the data model or DB schema
- Do not alter existing compositions already persisted (only affects newly created ones)

## Canonical Layer Table (from WS3-3.1)

| # | Name | Concept / Prompt |
|---|------|-----------------|
| 1 | Foundation | Play the root note — C. This is the anchor of your entire harmony. |
| 2 | The Fifth | Add the perfect fifth — G. It creates openness and stability above the root. |
| 3 | The Third | Complete the triad by adding the third — E. This gives the chord its bright character. |
| 4 | The Seventh | Add the major seventh — B. It brings sophistication and luminous tension. |
| 5 | The Ninth | Add the ninth — D. The second degree, extending the harmony into a new voice. |
| 6 | The Sixth | Add the major sixth — A. It brings warmth and a sense of longing. |
| 7 | Resolution | Return to the root — C, one octave higher. Anchor the harmony and complete your composition. |

## Tasks & Acceptance

- [x] Update `GetDefaultLayerName()` switch to match the 7-layer canonical names
- [x] Update `GetDefaultLayerConcept()` switch to match the 7-layer canonical prompts
- [x] All existing backend tests pass without changes
- [x] A newly created composition has matching layer names/concepts to what WS3-3.1 expects

</frozen-after-approval>
