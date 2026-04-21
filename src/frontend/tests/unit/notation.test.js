/**
 * Unit tests for grand-staff notation logic.
 *
 * Because notation.js depends on DOM globals (document.createElementNS) and imports
 * from dom.js which queries real elements, we test the pure logic via the helper
 * functions exposed through music.js (getNoteDescriptor, midiToOctaveLabel) and verify
 * the staff-assignment rules and diatonic-index calculations.
 */
import { describe, it, expect } from "vitest";
import { getNoteDescriptor, midiToOctaveLabel } from "../../wwwroot/scripts/music.js";

// ── Staff-assignment rule ─────────────────────────────────────────────────────
// MIDI ≥ 60 (C4) → treble staff; MIDI < 60 → bass staff.

describe("staff assignment (MIDI ≥ 60 → treble)", () => {
  const isTreble = (midi) => midi >= 60;

  it("assigns C4 (MIDI 60) to treble", () => expect(isTreble(60)).toBe(true));
  it("assigns B3 (MIDI 59) to bass",   () => expect(isTreble(59)).toBe(false));
  it("assigns A4 (MIDI 69) to treble", () => expect(isTreble(69)).toBe(true));
  it("assigns G2 (MIDI 43) to bass",   () => expect(isTreble(43)).toBe(false));
  it("assigns C5 (MIDI 72) to treble", () => expect(isTreble(72)).toBe(true));
  it("assigns A0 (MIDI 21) to bass",   () => expect(isTreble(21)).toBe(false));
});

// ── Middle C identification ───────────────────────────────────────────────────

describe("middle C detection", () => {
  it("C4 (MIDI 60) has diatonicIndex 28", () => {
    expect(getNoteDescriptor(60).diatonicIndex).toBe(28);
  });

  it("B3 (MIDI 59) is NOT middle C (diatonicIndex 27)", () => {
    expect(getNoteDescriptor(59).diatonicIndex).toBe(27);
  });

  it("C5 (MIDI 72) is NOT middle C (diatonicIndex 35)", () => {
    expect(getNoteDescriptor(72).diatonicIndex).toBe(35);
  });
});

// ── Treble staff diatonic positions ──────────────────────────────────────────
// Treble bottom line = E4, diatonicIndex 30.
// Top line = F5, diatonicIndex 38.

describe("treble staff diatonic positions", () => {
  it("E4 (MIDI 64) is on the bottom treble line (diatonic 30)", () => {
    expect(getNoteDescriptor(64).diatonicIndex).toBe(30);
  });

  it("G4 (MIDI 67) is on the second treble line (diatonic 32)", () => {
    expect(getNoteDescriptor(67).diatonicIndex).toBe(32);
  });

  it("B4 (MIDI 71) is on the third treble line (diatonic 34)", () => {
    expect(getNoteDescriptor(71).diatonicIndex).toBe(34);
  });

  it("D5 (MIDI 74) is on the fourth treble line (diatonic 36)", () => {
    expect(getNoteDescriptor(74).diatonicIndex).toBe(36);
  });

  it("F5 (MIDI 77) is on the top treble line (diatonic 38)", () => {
    expect(getNoteDescriptor(77).diatonicIndex).toBe(38);
  });

  it("C4 (MIDI 60) sits below treble bottom line (diatonic 28 < 30)", () => {
    const d = getNoteDescriptor(60).diatonicIndex;
    expect(d).toBe(28);
    expect(d < 30).toBe(true); // ledger line required
  });
});

// ── Bass staff diatonic positions ─────────────────────────────────────────────
// Bass bottom line = G2, diatonicIndex 18.
// Top line = A3, diatonicIndex 26.

describe("bass staff diatonic positions", () => {
  it("G2 (MIDI 43) is on the bottom bass line (diatonic 18)", () => {
    expect(getNoteDescriptor(43).diatonicIndex).toBe(18);
  });

  it("B2 (MIDI 47) is on the second bass line (diatonic 20)", () => {
    expect(getNoteDescriptor(47).diatonicIndex).toBe(20);
  });

  it("D3 (MIDI 50) is on the third bass line (diatonic 22)", () => {
    expect(getNoteDescriptor(50).diatonicIndex).toBe(22);
  });

  it("F3 (MIDI 53) is on the fourth bass line (diatonic 24)", () => {
    expect(getNoteDescriptor(53).diatonicIndex).toBe(24);
  });

  it("A3 (MIDI 57) is on the top bass line (diatonic 26)", () => {
    expect(getNoteDescriptor(57).diatonicIndex).toBe(26);
  });

  it("B3 (MIDI 59) sits above bass top line (diatonic 27 > 26)", () => {
    const d = getNoteDescriptor(59).diatonicIndex;
    expect(d).toBe(27);
    expect(d > 26).toBe(true); // ledger line required
  });
});

// ── Octave-aware labels ───────────────────────────────────────────────────────

describe("octave-aware note labels via midiToOctaveLabel", () => {
  it("labels C4 (middle C) correctly", () => expect(midiToOctaveLabel(60)).toBe("C4"));
  it("labels G4 correctly",            () => expect(midiToOctaveLabel(67)).toBe("G4"));
  it("labels F♯4 correctly",           () => expect(midiToOctaveLabel(66)).toBe("F♯4"));
  it("labels B3 below middle C",       () => expect(midiToOctaveLabel(59)).toBe("B3"));
  it("labels G2 (bass bottom line)",   () => expect(midiToOctaveLabel(43)).toBe("G2"));
  it("labels A0 (lowest piano key)",   () => expect(midiToOctaveLabel(21)).toBe("A0"));
  it("labels C8 (highest piano key)",  () => expect(midiToOctaveLabel(108)).toBe("C8"));
});

// ── Chord grouping rule ───────────────────────────────────────────────────────
// Notes with the same timingMs should be in the same beat column.

describe("chord grouping (same timingMs → same beat)", () => {
  function groupByTiming(notes) {
    const map = new Map();
    for (const note of notes) {
      if (!map.has(note.timingMs)) map.set(note.timingMs, []);
      map.get(note.timingMs).push(note);
    }
    return [...map.values()];
  }

  it("three notes at the same time form one chord column", () => {
    const notes = [
      { midi: 60, timingMs: 0 },
      { midi: 64, timingMs: 0 },
      { midi: 67, timingMs: 0 }
    ];
    const beats = groupByTiming(notes);
    expect(beats).toHaveLength(1);
    expect(beats[0]).toHaveLength(3);
  });

  it("notes at different times create separate beat columns", () => {
    const notes = [
      { midi: 60, timingMs: 0 },
      { midi: 64, timingMs: 500 },
      { midi: 67, timingMs: 1000 }
    ];
    const beats = groupByTiming(notes);
    expect(beats).toHaveLength(3);
  });

  it("mixed simultaneous and sequential notes group correctly", () => {
    const notes = [
      { midi: 60, timingMs: 0 },
      { midi: 64, timingMs: 0 }, // chord with above
      { midi: 67, timingMs: 500 }
    ];
    const beats = groupByTiming(notes);
    expect(beats).toHaveLength(2);
    expect(beats[0]).toHaveLength(2);
    expect(beats[1]).toHaveLength(1);
  });
});

// ── Cross-stave splits (chord spanning treble+bass) ───────────────────────────

describe("chord notes that span both staves", () => {
  it("C4 and G2 in the same chord go to different staves", () => {
    const notes = [
      { midi: 60 }, // treble
      { midi: 43 }  // bass
    ];
    const treble = notes.filter((n) => n.midi >= 60);
    const bass   = notes.filter((n) => n.midi < 60);
    expect(treble).toHaveLength(1);
    expect(bass).toHaveLength(1);
  });

  it("C5, E4, and B2 split: two treble, one bass", () => {
    const notes = [{ midi: 72 }, { midi: 64 }, { midi: 47 }];
    expect(notes.filter((n) => n.midi >= 60)).toHaveLength(2);
    expect(notes.filter((n) => n.midi < 60)).toHaveLength(1);
  });
});
