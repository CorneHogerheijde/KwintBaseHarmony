export const pianoRange = { start: 21, end: 108 }; // full 88-key range (A0–C8)
export const LAYER_COUNT = 7;

// Sharps represented as Unicode ♯ for display; internal pitch class index is position in array.
const noteNames    = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
// Enharmonic flat equivalents for display when a flat spelling is preferred.
const flatNames    = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
const diatonicSteps = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

export function normalizeMidi(midi) {
  return Math.max(0, Math.min(127, Number(midi) || 0));
}

export function midiToLabel(midi) {
  const normalized = normalizeMidi(midi);
  const octave = Math.floor(normalized / 12) - 1;
  return `${noteNames[normalized % 12]}${octave}`;
}

/**
 * Returns an octave-qualified note label for a MIDI note number (e.g. C4, G♯3).
 * Alias for midiToLabel — provided as the single canonical label function so that
 * piano keys, notation, and puzzle hints all share one implementation.
 * @param {number} midi
 * @returns {string}
 */
export const midiToOctaveLabel = midiToLabel;

export function getNoteDescriptor(midi) {
  const normalized = normalizeMidi(midi);
  const pc        = normalized % 12;
  const octave    = Math.floor(normalized / 12) - 1;
  const token     = noteNames[pc];
  const letter    = token[0];
  const accidental = token.length > 1 ? token.slice(1) : "";

  return {
    midi: normalized,
    token,
    octave,
    letter,
    accidental,
    label: `${token}${octave}`,
    diatonicIndex: octave * 7 + diatonicSteps[letter]
  };
}

export function midiToFrequency(midi) {
  return 440 * 2 ** ((normalizeMidi(midi) - 69) / 12);
}

export function isBlackKey(midi) {
  // Black keys are pitch classes: 1, 3, 6, 8, 10  (the sharps/flats)
  const pc = normalizeMidi(midi) % 12;
  return pc === 1 || pc === 3 || pc === 6 || pc === 8 || pc === 10;
}