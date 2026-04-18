import { describe, it, expect } from "vitest";
import { KEY_PROFILES, KEY_SIG_DIATONIC, getKeyProfile } from "../../wwwroot/scripts/key-profiles.js";

// ── KEY_PROFILES structure ────────────────────────────────────────────────────

describe("KEY_PROFILES", () => {
  it("contains 9 entries (C + 4 sharp + 4 flat)", () => {
    expect(KEY_PROFILES).toHaveLength(9);
  });

  it("first entry is C major with no accidentals", () => {
    const c = KEY_PROFILES[0];
    expect(c.rootMidi).toBe(60);
    expect(c.name).toBe("C major");
    expect(c.accidentals).toHaveLength(0);
    expect(c.accidentalType).toBe("none");
  });

  it("every profile has required fields: rootMidi, name, label, accidentals, accidentalType", () => {
    for (const k of KEY_PROFILES) {
      expect(typeof k.rootMidi).toBe("number");
      expect(typeof k.name).toBe("string");
      expect(typeof k.label).toBe("string");
      expect(Array.isArray(k.accidentals)).toBe(true);
      expect(["none", "sharp", "flat"]).toContain(k.accidentalType);
    }
  });

  it("sharp keys list accidentals in circle-of-fifths order", () => {
    const g = KEY_PROFILES.find((k) => k.name === "G major");
    expect(g.accidentals).toEqual(["F\u266f"]);

    const d = KEY_PROFILES.find((k) => k.name === "D major");
    expect(d.accidentals).toEqual(["F\u266f", "C\u266f"]);

    const a = KEY_PROFILES.find((k) => k.name === "A major");
    expect(a.accidentals).toEqual(["F\u266f", "C\u266f", "G\u266f"]);

    const e = KEY_PROFILES.find((k) => k.name === "E major");
    expect(e.accidentals).toEqual(["F\u266f", "C\u266f", "G\u266f", "D\u266f"]);
  });

  it("flat keys list accidentals in circle-of-fifths order", () => {
    const f = KEY_PROFILES.find((k) => k.name === "F major");
    expect(f.accidentals).toEqual(["B\u266d"]);

    const bb = KEY_PROFILES.find((k) => k.name === "B\u266d major");
    expect(bb.accidentals).toEqual(["B\u266d", "E\u266d"]);

    const eb = KEY_PROFILES.find((k) => k.name === "E\u266d major");
    expect(eb.accidentals).toEqual(["B\u266d", "E\u266d", "A\u266d"]);

    const ab = KEY_PROFILES.find((k) => k.name === "A\u266d major");
    expect(ab.accidentals).toEqual(["B\u266d", "E\u266d", "A\u266d", "D\u266d"]);
  });

  it("sharp key rootMidi values match expected MIDI pitches", () => {
    const expected = { "G major": 67, "D major": 62, "A major": 69, "E major": 64 };
    for (const [name, midi] of Object.entries(expected)) {
      expect(KEY_PROFILES.find((k) => k.name === name)?.rootMidi).toBe(midi);
    }
  });

  it("flat key rootMidi values match expected MIDI pitches", () => {
    const expected = { "F major": 65, "B\u266d major": 70, "E\u266d major": 63, "A\u266d major": 68 };
    for (const [name, midi] of Object.entries(expected)) {
      expect(KEY_PROFILES.find((k) => k.name === name)?.rootMidi).toBe(midi);
    }
  });

  it("no two profiles share the same rootMidi", () => {
    const midis = KEY_PROFILES.map((k) => k.rootMidi);
    expect(new Set(midis).size).toBe(KEY_PROFILES.length);
  });
});

// ── getKeyProfile ─────────────────────────────────────────────────────────────

describe("getKeyProfile", () => {
  it("returns C major profile for rootMidi 60", () => {
    expect(getKeyProfile(60).name).toBe("C major");
  });

  it("returns G major profile for rootMidi 67", () => {
    const p = getKeyProfile(67);
    expect(p.name).toBe("G major");
    expect(p.accidentals).toEqual(["F\u266f"]);
    expect(p.accidentalType).toBe("sharp");
  });

  it("returns B\u266d major profile for rootMidi 70", () => {
    const p = getKeyProfile(70);
    expect(p.name).toBe("B\u266d major");
    expect(p.accidentals).toEqual(["B\u266d", "E\u266d"]);
    expect(p.accidentalType).toBe("flat");
  });

  it("falls back to C major for an unrecognised rootMidi", () => {
    expect(getKeyProfile(61).name).toBe("C major"); // C\u266f/D\u266d not in the list
    expect(getKeyProfile(99).name).toBe("C major");
  });

  it("returns profiles for all 9 supported rootMidi values", () => {
    const roots = [60, 67, 62, 69, 64, 65, 70, 63, 68];
    for (const midi of roots) {
      const profile = getKeyProfile(midi);
      expect(profile.rootMidi).toBe(midi);
    }
  });
});

// ── KEY_SIG_DIATONIC positions ────────────────────────────────────────────────

describe("KEY_SIG_DIATONIC", () => {
  it("treble sharp positions have 7 entries starting with F5 (diatonic 38)", () => {
    expect(KEY_SIG_DIATONIC.treble.sharp).toHaveLength(7);
    expect(KEY_SIG_DIATONIC.treble.sharp[0]).toBe(38); // F5
  });

  it("treble flat positions have 7 entries starting with B4 (diatonic 34)", () => {
    expect(KEY_SIG_DIATONIC.treble.flat).toHaveLength(7);
    expect(KEY_SIG_DIATONIC.treble.flat[0]).toBe(34); // B4
  });

  it("bass sharp positions have 7 entries starting with F3 (diatonic 24)", () => {
    expect(KEY_SIG_DIATONIC.bass.sharp).toHaveLength(7);
    expect(KEY_SIG_DIATONIC.bass.sharp[0]).toBe(24); // F3
  });

  it("bass flat positions have 7 entries starting with B2 (diatonic 20)", () => {
    expect(KEY_SIG_DIATONIC.bass.flat).toHaveLength(7);
    expect(KEY_SIG_DIATONIC.bass.flat[0]).toBe(20); // B2
  });

  it("all diatonic positions are numbers in the valid staff range", () => {
    for (const clef of Object.values(KEY_SIG_DIATONIC)) {
      for (const positions of Object.values(clef)) {
        for (const pos of positions) {
          expect(typeof pos).toBe("number");
          expect(pos).toBeGreaterThanOrEqual(0);
          expect(pos).toBeLessThan(50);
        }
      }
    }
  });

  it("treble sharp order covers correct accidental staff lines (F5→C5→G5→D5→A4→E5→B4)", () => {
    expect(KEY_SIG_DIATONIC.treble.sharp).toEqual([38, 35, 39, 36, 33, 37, 34]);
  });

  it("treble flat order covers correct accidental staff lines (B4→E5→A4→D5→G4→C5→F5)", () => {
    expect(KEY_SIG_DIATONIC.treble.flat).toEqual([34, 37, 33, 36, 32, 35, 38]);
  });
});

// ── Transposition interaction ─────────────────────────────────────────────────

describe("key profile and transposition", () => {
  it("G major profile offset from C is +7 semitones", () => {
    const c = getKeyProfile(60);
    const g = getKeyProfile(67);
    expect(g.rootMidi - c.rootMidi).toBe(7);
  });

  it("F major profile offset from C is +5 semitones", () => {
    const f = getKeyProfile(65);
    expect(f.rootMidi - 60).toBe(5);
  });

  it("Bb major profile offset from C is +10 semitones", () => {
    const bb = getKeyProfile(70);
    expect(bb.rootMidi - 60).toBe(10);
  });

  it("each successive sharp key adds exactly one more accidental", () => {
    const sharpKeys = KEY_PROFILES.filter((k) => k.accidentalType === "sharp");
    for (let i = 1; i < sharpKeys.length; i++) {
      expect(sharpKeys[i].accidentals.length).toBe(sharpKeys[i - 1].accidentals.length + 1);
    }
  });

  it("each successive flat key adds exactly one more accidental", () => {
    const flatKeys = KEY_PROFILES.filter((k) => k.accidentalType === "flat");
    for (let i = 1; i < flatKeys.length; i++) {
      expect(flatKeys[i].accidentals.length).toBe(flatKeys[i - 1].accidentals.length + 1);
    }
  });
});
