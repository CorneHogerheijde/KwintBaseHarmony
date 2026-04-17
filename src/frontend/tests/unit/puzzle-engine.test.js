import { describe, it, expect } from "vitest";
import {
  getPuzzleLayers,
  isCorrectNote,
  getFirstIncompleteLayer,
  transposeLayers,
  getMultipleChoiceOptions,
} from "../../wwwroot/scripts/puzzle-engine.js";

// ── getPuzzleLayers ───────────────────────────────────────────────────────────

describe("getPuzzleLayers", () => {
  it("returns 7 layers for beginner", () => {
    expect(getPuzzleLayers("beginner")).toHaveLength(7);
  });

  it("returns 7 layers for intermediate", () => {
    expect(getPuzzleLayers("intermediate")).toHaveLength(7);
  });

  it("returns 7 layers for advanced", () => {
    expect(getPuzzleLayers("advanced")).toHaveLength(7);
  });

  it("falls back to intermediate for unknown difficulty", () => {
    expect(getPuzzleLayers("expert")).toEqual(getPuzzleLayers("intermediate"));
  });

  it("beginner layer 1 targets C4 (MIDI 60) with autoHint true", () => {
    const layer = getPuzzleLayers("beginner").find((l) => l.number === 1);
    expect(layer.targetMidi).toBe(60);
    expect(layer.autoHint).toBe(true);
  });

  it("intermediate layer 1 targets C4 (MIDI 60) with autoHint false", () => {
    const layer = getPuzzleLayers("intermediate").find((l) => l.number === 1);
    expect(layer.targetMidi).toBe(60);
    expect(layer.autoHint).toBe(false);
  });

  it("advanced layer 1 targets C3 (MIDI 48)", () => {
    const layer = getPuzzleLayers("advanced").find((l) => l.number === 1);
    expect(layer.targetMidi).toBe(48);
  });

  it("intermediate layer 2 targets G4 (perfect fifth, MIDI 67)", () => {
    const layer = getPuzzleLayers("intermediate").find((l) => l.number === 2);
    expect(layer.targetMidi).toBe(67);
  });

  it("every layer has number, name, prompt, hint, targetMidi", () => {
    for (const difficulty of ["beginner", "intermediate", "advanced"]) {
      for (const layer of getPuzzleLayers(difficulty)) {
        expect(layer).toHaveProperty("number");
        expect(layer).toHaveProperty("name");
        expect(layer).toHaveProperty("prompt");
        expect(layer).toHaveProperty("hint");
        expect(layer).toHaveProperty("targetMidi");
      }
    }
  });
});

// ── isCorrectNote ─────────────────────────────────────────────────────────────

describe("isCorrectNote", () => {
  it("returns true for the correct note on layer 1 (intermediate, C4=60)", () => {
    expect(isCorrectNote(1, 60, "intermediate")).toBe(true);
  });

  it("returns false for a wrong note on layer 1", () => {
    expect(isCorrectNote(1, 62, "intermediate")).toBe(false);
  });

  it("returns true for correct note on layer 2 (intermediate, G4=67)", () => {
    expect(isCorrectNote(2, 67, "intermediate")).toBe(true);
  });

  it("returns false for layer 2 note when given layer 1 (wrong layer)", () => {
    expect(isCorrectNote(1, 67, "intermediate")).toBe(false);
  });

  it("uses intermediate as default difficulty", () => {
    expect(isCorrectNote(1, 60)).toBe(true);
  });

  it("respects difficulty — advanced layer 1 is C3 (48), not C4 (60)", () => {
    expect(isCorrectNote(1, 48, "advanced")).toBe(true);
    expect(isCorrectNote(1, 60, "advanced")).toBe(false);
  });

  it("returns false for out-of-range layer number", () => {
    expect(isCorrectNote(99, 60, "intermediate")).toBe(false);
  });
});

// ── getFirstIncompleteLayer ───────────────────────────────────────────────────

function buildComposition(completedLayers = [], difficulty = "intermediate") {
  const layers = getPuzzleLayers(difficulty).map((pl) => ({
    layerNumber: pl.number,
    completed: completedLayers.includes(pl.number),
  }));
  return { layers };
}

describe("getFirstIncompleteLayer", () => {
  it("returns 1 when no layers are complete", () => {
    expect(getFirstIncompleteLayer(buildComposition(), "intermediate")).toBe(1);
  });

  it("returns 2 when layer 1 is complete", () => {
    expect(getFirstIncompleteLayer(buildComposition([1]), "intermediate")).toBe(2);
  });

  it("returns null when all 7 layers are complete", () => {
    expect(getFirstIncompleteLayer(buildComposition([1, 2, 3, 4, 5, 6, 7]), "intermediate")).toBeNull();
  });

  it("skips over completed layers correctly (3 complete)", () => {
    expect(getFirstIncompleteLayer(buildComposition([1, 2, 3]), "intermediate")).toBe(4);
  });

  it("works with advanced difficulty", () => {
    expect(getFirstIncompleteLayer(buildComposition([1, 2], "advanced"), "advanced")).toBe(3);
  });
});

// ── transposeLayers ───────────────────────────────────────────────────────────

describe("transposeLayers", () => {
  const baseLayers = getPuzzleLayers("intermediate");

  it("identity: rootMidi=60 produces no change in targetMidi values", () => {
    const result = transposeLayers(baseLayers, 60);
    result.forEach((layer, i) => {
      expect(layer.targetMidi).toBe(baseLayers[i].targetMidi);
    });
  });

  it("positive offset: rootMidi=62 shifts all targetMidi by +2", () => {
    const result = transposeLayers(baseLayers, 62);
    result.forEach((layer, i) => {
      expect(layer.targetMidi).toBe(baseLayers[i].targetMidi + 2);
    });
  });

  it("negative offset: rootMidi=57 shifts all targetMidi by -3", () => {
    const result = transposeLayers(baseLayers, 57);
    result.forEach((layer, i) => {
      expect(layer.targetMidi).toBe(baseLayers[i].targetMidi - 3);
    });
  });

  it("immutability: original array is not mutated", () => {
    const original = getPuzzleLayers("intermediate");
    const originalMidis = original.map((l) => l.targetMidi);
    transposeLayers(original, 62);
    original.forEach((layer, i) => {
      expect(layer.targetMidi).toBe(originalMidis[i]);
    });
  });
});

// ── getMultipleChoiceOptions ──────────────────────────────────────────────────

describe("getMultipleChoiceOptions", () => {
  it("returns exactly 4 options for layer 1 (default rootMidi)", () => {
    const options = getMultipleChoiceOptions(1);
    expect(options).toHaveLength(4);
  });

  it("exactly one option is correct", () => {
    for (let layer = 1; layer <= 7; layer++) {
      const options = getMultipleChoiceOptions(layer);
      const correct = options.filter((o) => o.isCorrect);
      expect(correct).toHaveLength(1);
    }
  });

  it("correct option midi matches transposed intermediate target for the layer", () => {
    const rootMidi = 62; // D4
    const layers = transposeLayers(getPuzzleLayers("intermediate"), rootMidi);
    for (let layer = 1; layer <= 7; layer++) {
      const options = getMultipleChoiceOptions(layer, rootMidi);
      const correct = options.find((o) => o.isCorrect);
      const expected = layers.find((l) => l.number === layer)?.targetMidi;
      expect(correct?.midi).toBe(expected);
    }
  });

  it("each option has a label string", () => {
    const options = getMultipleChoiceOptions(3, 60);
    for (const o of options) {
      expect(typeof o.label).toBe("string");
      expect(o.label.length).toBeGreaterThan(0);
    }
  });

  it("options are shuffled (not always in same order across runs)", () => {
    // Run 10 times; the correct option should not always be at index 0
    const positions = new Set();
    for (let i = 0; i < 20; i++) {
      const opts = getMultipleChoiceOptions(1, 60);
      positions.add(opts.findIndex((o) => o.isCorrect));
    }
    // With 4 positions and 20 runs, we expect more than 1 unique position
    expect(positions.size).toBeGreaterThan(1);
  });
});
