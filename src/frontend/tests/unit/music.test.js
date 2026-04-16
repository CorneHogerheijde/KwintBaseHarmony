import { describe, it, expect } from "vitest";
import {
  normalizeMidi,
  midiToLabel,
  getNoteDescriptor,
  midiToFrequency,
  isBlackKey,
  LAYER_COUNT,
  pianoRange,
} from "../../wwwroot/scripts/music.js";

describe("LAYER_COUNT", () => {
  it("is 7", () => expect(LAYER_COUNT).toBe(7));
});

describe("pianoRange", () => {
  it("spans A0 (21) to C8 (108)", () => {
    expect(pianoRange.start).toBe(21);
    expect(pianoRange.end).toBe(108);
  });
});

describe("normalizeMidi", () => {
  it("clamps below 0 to 0", () => expect(normalizeMidi(-1)).toBe(0));
  it("clamps above 127 to 127", () => expect(normalizeMidi(200)).toBe(127));
  it("returns the value unchanged when in range", () => expect(normalizeMidi(60)).toBe(60));
  it("coerces strings to numbers", () => expect(normalizeMidi("72")).toBe(72));
  it("treats NaN as 0", () => expect(normalizeMidi("abc")).toBe(0));
});

describe("midiToLabel", () => {
  it("labels middle C as C4", () => expect(midiToLabel(60)).toBe("C4"));
  it("labels G4 correctly", () => expect(midiToLabel(67)).toBe("G4"));
  it("labels C♯4 for MIDI 61", () => expect(midiToLabel(61)).toBe("C♯4"));
  it("labels A0 for MIDI 21 (lowest piano key)", () => expect(midiToLabel(21)).toBe("A0"));
  it("labels C8 for MIDI 108 (highest piano key)", () => expect(midiToLabel(108)).toBe("C8"));
});

describe("getNoteDescriptor", () => {
  it("returns correct fields for C4 (MIDI 60)", () => {
    const d = getNoteDescriptor(60);
    expect(d.midi).toBe(60);
    expect(d.letter).toBe("C");
    expect(d.accidental).toBe("");
    expect(d.octave).toBe(4);
    expect(d.label).toBe("C4");
  });

  it("returns correct accidental symbol for C♯4 (MIDI 61)", () => {
    const d = getNoteDescriptor(61);
    expect(d.letter).toBe("C");
    expect(d.accidental).toBe("♯");
  });

  it("computes the correct diatonicIndex for C4", () => {
    // octave 4, step 0 → 4*7 + 0 = 28
    expect(getNoteDescriptor(60).diatonicIndex).toBe(28);
  });

  it("computes the correct diatonicIndex for G4 (MIDI 67)", () => {
    // octave 4, step 4 → 4*7 + 4 = 32
    expect(getNoteDescriptor(67).diatonicIndex).toBe(32);
  });
});

describe("midiToFrequency", () => {
  it("returns 440 Hz for A4 (MIDI 69)", () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 1);
  });

  it("returns ~261.6 Hz for middle C (MIDI 60)", () => {
    expect(midiToFrequency(60)).toBeCloseTo(261.63, 0);
  });
});

describe("isBlackKey", () => {
  it("returns true for C♯4 (MIDI 61)", () => expect(isBlackKey(61)).toBe(true));
  it("returns true for F♯4 (MIDI 66)", () => expect(isBlackKey(66)).toBe(true));
  it("returns false for C4 (MIDI 60)", () => expect(isBlackKey(60)).toBe(false));
  it("returns false for E4 (MIDI 64)", () => expect(isBlackKey(64)).toBe(false));
  it("returns false for B4 (MIDI 71)", () => expect(isBlackKey(71)).toBe(false));
});
