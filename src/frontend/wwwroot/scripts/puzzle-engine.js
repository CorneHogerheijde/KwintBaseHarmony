/**
 * Puzzle layer definitions for the Kwintessence harmonic progression.
 * All target notes are in C major, within the piano keyboard range (MIDI 48–72).
 */
export const puzzleLayers = [
  {
    number: 1,
    name: "Foundation",
    prompt: "Play the root note — C. This is the anchor of your entire harmony.",
    hint: "C4 is the white key labeled C in the middle of the keyboard (MIDI 60).",
    targetMidi: 60
  },
  {
    number: 2,
    name: "The Fifth",
    prompt: "Add the perfect fifth — G. It creates openness and stability above the root.",
    hint: "G4 is a white key, seven semitones above C (MIDI 67).",
    targetMidi: 67
  },
  {
    number: 3,
    name: "The Third",
    prompt: "Complete the triad by adding the third — E. This gives the chord its bright, optimistic character.",
    hint: "E4 is a white key, four semitones above C (MIDI 64).",
    targetMidi: 64
  },
  {
    number: 4,
    name: "The Seventh",
    prompt: "Add the major seventh — B. It brings sophistication and a luminous tension to the chord.",
    hint: "B4 is a white key, just one semitone below the upper C (MIDI 71).",
    targetMidi: 71
  },
  {
    number: 5,
    name: "The Ninth",
    prompt: "Add the ninth — D. The second degree of the scale, extending the harmony into a new voice.",
    hint: "D4 is a white key, two semitones above C (MIDI 62).",
    targetMidi: 62
  },
  {
    number: 6,
    name: "The Sixth",
    prompt: "Add the major sixth — A. It brings warmth and a sense of longing to the harmony.",
    hint: "A4 is a white key, nine semitones above C (MIDI 69).",
    targetMidi: 69
  },
  {
    number: 7,
    name: "Resolution",
    prompt: "Return to the root — C, one octave higher. Anchor the harmony and complete your composition.",
    hint: "C5 is the rightmost C on the keyboard (MIDI 72).",
    targetMidi: 72
  }
];

/**
 * Returns true when the given MIDI note matches the target for the given layer number.
 * @param {number} layerNumber 1–7
 * @param {number} midi MIDI note number 0–127
 */
export function isCorrectNote(layerNumber, midi) {
  const layer = puzzleLayers.find((l) => l.number === layerNumber);
  return layer?.targetMidi === midi;
}

/**
 * Returns the layerNumber of the first incomplete layer in the composition,
 * or null when all layers are complete.
 * @param {object} composition API composition response
 */
export function getFirstIncompleteLayer(composition) {
  for (const puzzleLayer of puzzleLayers) {
    const apiLayer = composition.layers.find((l) => l.layerNumber === puzzleLayer.number);
    if (!apiLayer?.completed) {
      return puzzleLayer.number;
    }
  }

  return null;
}
