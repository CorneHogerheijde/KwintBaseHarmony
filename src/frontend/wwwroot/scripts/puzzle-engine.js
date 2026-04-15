/**
 * Puzzle layer definitions for the Kwintessence harmonic progression.
 *
 * Each difficulty level (beginner / intermediate / advanced) has its own set of
 * target notes, prompts, and hints:
 *
 *  - beginner:     All notes in octave 4 (MIDI 60-72). Verbose prompts, hint always
 *                  shown automatically, explicit MIDI number in hint text.
 *  - intermediate: Same target notes as beginner. Concise prompts, hint on request only.
 *  - advanced:     Notes spread across two octaves (3 and 5) for wider voicing.
 *                  Minimal prompts, no key-location hint (only interval name).
 */

const layersByDifficulty = {
  beginner: [
    {
      number: 1,
      name: "Foundation",
      prompt: "Let's start simple. Find and play middle C — the root note. It's the anchor every harmony is built on.",
      hint: "Middle C is the white key at the center of the keyboard, labeled C4 (MIDI 60). It's the leftmost C in our range.",
      targetMidi: 60,
      autoHint: true
    },
    {
      number: 2,
      name: "The Fifth",
      prompt: "Great! Now add the perfect fifth above C. This interval sounds open and stable — the natural partner of the root.",
      hint: "Count seven white and black keys up from C4. That's G4 (MIDI 67), a white key.",
      targetMidi: 67,
      autoHint: true
    },
    {
      number: 3,
      name: "The Third",
      prompt: "Almost a chord! Add the major third above C. It gives your harmony a bright, happy character.",
      hint: "E4 is four semitones above C4 (MIDI 64). It's the white key just before the group of two black keys.",
      targetMidi: 64,
      autoHint: true
    },
    {
      number: 4,
      name: "The Seventh",
      prompt: "Now add the major seventh. It lifts your chord into something richer and more sophisticated.",
      hint: "B4 is just one semitone below the upper C — it's the white key immediately to the left of C5 (MIDI 71).",
      targetMidi: 71,
      autoHint: true
    },
    {
      number: 5,
      name: "The Ninth",
      prompt: "Add the ninth — the D above middle C. It extends your chord into a second voice, adding colour.",
      hint: "D4 is two semitones above middle C (MIDI 62). It's the white key immediately to the right of C4.",
      targetMidi: 62,
      autoHint: true
    },
    {
      number: 6,
      name: "The Sixth",
      prompt: "Nearly there! Add the major sixth — A. It brings warmth and a touch of longing to the harmony.",
      hint: "A4 is nine semitones above C4 (MIDI 69). It's the white key between G4 and B4.",
      targetMidi: 69,
      autoHint: true
    },
    {
      number: 7,
      name: "Resolution",
      prompt: "One last note: C, one octave higher. Return to the root and complete your composition.",
      hint: "C5 is the C immediately above B4 (MIDI 72) — the rightmost key in our range.",
      targetMidi: 72,
      autoHint: true
    }
  ],

  intermediate: [
    {
      number: 1,
      name: "Foundation",
      prompt: "Play the root note — C. This is the anchor of your entire harmony.",
      hint: "C4 is the white key labeled C in the middle of the keyboard (MIDI 60).",
      targetMidi: 60,
      autoHint: false
    },
    {
      number: 2,
      name: "The Fifth",
      prompt: "Add the perfect fifth — G. It creates openness and stability above the root.",
      hint: "G4 is a white key, seven semitones above C (MIDI 67).",
      targetMidi: 67,
      autoHint: false
    },
    {
      number: 3,
      name: "The Third",
      prompt: "Complete the triad by adding the third — E. This gives the chord its bright, optimistic character.",
      hint: "E4 is a white key, four semitones above C (MIDI 64).",
      targetMidi: 64,
      autoHint: false
    },
    {
      number: 4,
      name: "The Seventh",
      prompt: "Add the major seventh — B. It brings sophistication and a luminous tension to the chord.",
      hint: "B4 is a white key, just one semitone below the upper C (MIDI 71).",
      targetMidi: 71,
      autoHint: false
    },
    {
      number: 5,
      name: "The Ninth",
      prompt: "Add the ninth — D. The second degree of the scale, extending the harmony into a new voice.",
      hint: "D4 is a white key, two semitones above C (MIDI 62).",
      targetMidi: 62,
      autoHint: false
    },
    {
      number: 6,
      name: "The Sixth",
      prompt: "Add the major sixth — A. It brings warmth and a sense of longing to the harmony.",
      hint: "A4 is a white key, nine semitones above C (MIDI 69).",
      targetMidi: 69,
      autoHint: false
    },
    {
      number: 7,
      name: "Resolution",
      prompt: "Return to the root — C, one octave higher. Anchor the harmony and complete your composition.",
      hint: "C5 is the rightmost C on the keyboard (MIDI 72).",
      targetMidi: 72,
      autoHint: false
    }
  ],

  advanced: [
    {
      number: 1,
      name: "Foundation",
      prompt: "Root — C3. Set the bass foundation.",
      hint: "Perfect unison with the bass root. C3 (MIDI 48).",
      targetMidi: 48,
      autoHint: false
    },
    {
      number: 2,
      name: "The Fifth",
      prompt: "Perfect fifth — G3. Open voicing below the treble range.",
      hint: "A fifth above C3 is G3 (MIDI 55).",
      targetMidi: 55,
      autoHint: false
    },
    {
      number: 3,
      name: "The Third",
      prompt: "Major third — E4. Bring in the colour an octave higher.",
      hint: "E4 (MIDI 64) — a tenth above the root.",
      targetMidi: 64,
      autoHint: false
    },
    {
      number: 4,
      name: "The Seventh",
      prompt: "Major seventh — B4. Introduce the leading-tone tension.",
      hint: "B4 (MIDI 71) — major seventh above C4.",
      targetMidi: 71,
      autoHint: false
    },
    {
      number: 5,
      name: "The Ninth",
      prompt: "Ninth — D4. The second degree, in the tenor voice.",
      hint: "D4 (MIDI 62) — a ninth above C3.",
      targetMidi: 62,
      autoHint: false
    },
    {
      number: 6,
      name: "The Sixth",
      prompt: "Major sixth — A4. The colour tone in the upper middle voice.",
      hint: "A4 (MIDI 69) — a major sixth above C4.",
      targetMidi: 69,
      autoHint: false
    },
    {
      number: 7,
      name: "Resolution",
      prompt: "Resolution — C5. Close the upper voice back to the root.",
      hint: "C5 (MIDI 72) — the octave above middle C.",
      targetMidi: 72,
      autoHint: false
    }
  ]
};

/**
 * Returns the puzzle layer definitions for the given difficulty.
 * Falls back to intermediate for any unrecognised value.
 * @param {string} difficulty  "beginner" | "intermediate" | "advanced"
 * @returns {Array}
 */
export function getPuzzleLayers(difficulty) {
  return layersByDifficulty[difficulty] ?? layersByDifficulty.intermediate;
}

/**
 * @deprecated Use getPuzzleLayers(difficulty) instead.
 * Kept for backward-compatibility with existing tests.
 */
export const puzzleLayers = layersByDifficulty.intermediate;

/**
 * Returns true when the given MIDI note matches the target for the given layer number.
 * @param {number} layerNumber 1–7
 * @param {number} midi MIDI note number 0–127
 */
/**
 * Returns true when the given MIDI note matches the target for the given layer and difficulty.
 * @param {number} layerNumber 1–7
 * @param {number} midi MIDI note number 0–127
 * @param {string} [difficulty] "beginner" | "intermediate" | "advanced"
 */
export function isCorrectNote(layerNumber, midi, difficulty = "intermediate") {
  const layers = getPuzzleLayers(difficulty);
  const layer = layers.find((l) => l.number === layerNumber);
  return layer?.targetMidi === midi;
}

/**
 * Returns the layerNumber of the first incomplete layer in the composition,
 * or null when all layers are complete.
 * @param {object} composition API composition response
 * @param {string} [difficulty] "beginner" | "intermediate" | "advanced"
 */
export function getFirstIncompleteLayer(composition, difficulty = "intermediate") {
  const layers = getPuzzleLayers(difficulty);
  for (const puzzleLayer of layers) {
    const apiLayer = composition.layers.find((l) => l.layerNumber === puzzleLayer.number);
    if (!apiLayer?.completed) {
      return puzzleLayer.number;
    }
  }

  return null;
}
