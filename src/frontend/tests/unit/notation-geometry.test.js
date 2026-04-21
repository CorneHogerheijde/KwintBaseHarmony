/**
 * Unit tests for notation.js grand staff geometry (diatonicY).
 *
 * These tests cover the pure coordinate-mapping function.
 * DOM-dependent render functions (renderNotation, drawLedgerLines) are
 * covered by Cypress E2E tests instead.
 *
 * We import only the exported `diatonicY` function, which does not touch
 * the DOM. The dom.js dependency of notation.js is mocked out to avoid
 * document.getElementById errors in the Node environment.
 */
import { describe, it, expect, vi } from "vitest";

// Mock dom.js so that notation.js can be imported without a real DOM.
vi.mock("../../wwwroot/scripts/dom.js", () => ({
  notationStaff:   { replaceChildren: vi.fn() },
  notationSummary: { textContent: "" }
}));

// Mock key-profiles.js to avoid importing it in node env (it is pure JS and
// safe, but the explicit mock makes test isolation clearer).
vi.mock("../../wwwroot/scripts/key-profiles.js", () => ({
  getKeyProfile: () => ({ accidentalType: "none", accidentals: [] }),
  KEY_SIG_DIATONIC: {}
}));

import { diatonicY } from "../../wwwroot/scripts/notation.js";

// ── Grand staff geometry constants (must match notation.js) ──────────────────
const TREBLE_BOTTOM_Y   = 100;
const TREBLE_BOTTOM_IDX = 30; // E4
const NOTE_SPACING      = 10;

describe("diatonicY — grand staff coordinate mapping", () => {
  it("returns TREBLE_BOTTOM_Y for E4 (diatonicIndex 30 — treble bottom line)", () => {
    expect(diatonicY(30)).toBe(TREBLE_BOTTOM_Y);
  });

  it("returns TREBLE_BOTTOM_Y - 80 for F5 (diatonicIndex 38 — treble top line)", () => {
    expect(diatonicY(38)).toBe(TREBLE_BOTTOM_Y - (38 - TREBLE_BOTTOM_IDX) * NOTE_SPACING);
    expect(diatonicY(38)).toBe(20);
  });

  it("places C4 (diatonicIndex 28) below treble bottom by 2 diatonic steps (ledger zone)", () => {
    expect(diatonicY(28)).toBe(120); // 100 + 20
  });

  it("places G2 (diatonicIndex 18 — bass bottom line) at 220", () => {
    expect(diatonicY(18)).toBe(220);
  });

  it("places A3 (diatonicIndex 26 — bass top line) at 140", () => {
    expect(diatonicY(26)).toBe(140);
  });

  it("Y decreases as diatonicIndex increases (higher pitch = higher on staff = lower Y)", () => {
    expect(diatonicY(32)).toBeLessThan(diatonicY(30));
    expect(diatonicY(38)).toBeLessThan(diatonicY(32));
  });

  it("Y increases as diatonicIndex decreases (lower pitch = lower on staff = higher Y)", () => {
    expect(diatonicY(26)).toBeGreaterThan(diatonicY(28));
    expect(diatonicY(18)).toBeGreaterThan(diatonicY(26));
  });

  it("each diatonic step changes Y by exactly NOTE_SPACING (10 px)", () => {
    expect(diatonicY(32) - diatonicY(33)).toBe(NOTE_SPACING);
    expect(diatonicY(28) - diatonicY(29)).toBe(NOTE_SPACING);
  });

  it("treble formula and bass formula agree at C4 (unified coordinate system)", () => {
    // C4 is at diatonicIndex 28. Whether approached from treble or bass,
    // the formula gives the same Y.
    const yFromTreble = TREBLE_BOTTOM_Y - (28 - TREBLE_BOTTOM_IDX) * NOTE_SPACING;
    expect(diatonicY(28)).toBe(yFromTreble);
  });
});
