export const pianoRange = { start: 48, end: 72 };

const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const diatonicSteps = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

export function normalizeMidi(midi) {
  return Math.max(0, Math.min(127, Number(midi) || 0));
}

export function midiToLabel(midi) {
  const normalized = normalizeMidi(midi);
  const octave = Math.floor(normalized / 12) - 1;
  return `${noteNames[normalized % 12]}${octave}`;
}

export function getNoteDescriptor(midi) {
  const normalized = normalizeMidi(midi);
  const token = noteNames[normalized % 12];
  const octave = Math.floor(normalized / 12) - 1;
  const letter = token[0];
  const accidental = token.slice(1);

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
  return noteNames[normalizeMidi(midi) % 12].includes("#");
}