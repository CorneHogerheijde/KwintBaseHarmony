import { getPuzzleLayers } from "./puzzle-layers-data.js";
export { getPuzzleLayers };


/**
 * Returns true when the given MIDI note matches the target for the given layer and difficulty.
 * @param {number} layerNumber 1–7
 * @param {number} midi MIDI note number 0–127
 * @param {string} [difficulty] "beginner" | "intermediate" | "advanced"
 * @param {string} [style] "classical" | "jazz" | "blues"
 */
export function isCorrectNote(layerNumber, midi, difficulty = "intermediate", style = "classical") {
  const layers = getPuzzleLayers(difficulty, style);
  const layer = layers.find((l) => l.number === layerNumber);
  return layer?.targetMidi === midi;
}

/**
 * Returns true when the selected MIDI notes exactly match the target chord
 * for the given layer and difficulty (order-independent).
 * @param {number} layerNumber 1–7
 * @param {number[]} selectedMidis Array of selected MIDI note numbers
 * @param {string} [difficulty] "beginner" | "intermediate" | "advanced"
 * @param {string} [style] "classical" | "jazz" | "blues"
 */
export function isCorrectChord(layerNumber, selectedMidis, difficulty = "intermediate", style = "classical") {
  const layers = getPuzzleLayers(difficulty, style);
  const layer = layers.find((l) => l.number === layerNumber);
  if (!layer?.targetMidis) return false;
  if (selectedMidis.length !== layer.targetMidis.length) return false;
  const sorted = [...selectedMidis].sort((a, b) => a - b);
  const target = [...layer.targetMidis].sort((a, b) => a - b);
  return sorted.every((midi, i) => midi === target[i]);
}

/**
 * Returns a new array of layers with each layer's targetMidi offset by
 * (rootMidi - 60), so the puzzle is transposed to the given root note.
 * Prompts, hints, and explanations are also rewritten with transposed note names.
 * Does not mutate the input array or its objects.
 * @param {Array} layers  Layer objects (each with a targetMidi property)
 * @param {number} rootMidi  MIDI note number of the desired root (60 = C)
 * @returns {Array}
 */

const _NOTE_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const _NOTE_FLATS  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
// Root indices that conventionally use flats: Db(1), Eb(3), F(5), Ab(8), Bb(10)
const _FLAT_ROOT_INDICES = new Set([1, 3, 5, 8, 10]);

function _noteIdx(name) {
  const i = _NOTE_SHARPS.indexOf(name);
  return i !== -1 ? i : _NOTE_FLATS.indexOf(name);
}

/**
 * Replaces note names (e.g. "C", "G4", "Cmaj7", "Am") in a string with their
 * equivalents after shifting by the given number of semitones.
 */
function transposeText(text, semitones) {
  if (!text || semitones === 0) return text;
  const rootChromatic = ((semitones % 12) + 12) % 12;
  const outNames = _FLAT_ROOT_INDICES.has(rootChromatic) ? _NOTE_FLATS : _NOTE_SHARPS;
  return text.replace(
    /\b([A-G][b#]?)(maj\d*|min\d*|m(?!\w)|aug|dim|sus\d*|add\d*|\d|)\b/g,
    (match, notePart, suffix) => {
      const idx = _noteIdx(notePart);
      if (idx === -1) return match;
      const raw = idx + semitones;
      const newNote = outNames[((raw % 12) + 12) % 12];
      // Adjust octave digit when the note wraps across an octave boundary
      if (suffix && /^\d$/.test(suffix)) {
        return `${newNote}${parseInt(suffix, 10) + Math.floor(raw / 12)}`;
      }
      return newNote + suffix;
    }
  );
}

export function transposeLayers(layers, rootMidi) {
  const offset = rootMidi - 60;
  if (offset === 0) return layers;
  return layers.map((layer) => ({
    ...layer,
    targetMidi: layer.targetMidi !== undefined ? layer.targetMidi + offset : undefined,
    ...(layer.targetMidis ? { targetMidis: layer.targetMidis.map((m) => m + offset) } : {}),
    prompt:      transposeText(layer.prompt, offset),
    hint:        transposeText(layer.hint, offset),
    explanation: transposeText(layer.explanation, offset)
  }));
}

/**
 * Returns the layerNumber of the first incomplete layer in the composition,
 * or null when all layers are complete.
 * @param {object} composition API composition response
 * @param {string} [difficulty] "beginner" | "intermediate" | "advanced"
 */
export function getFirstIncompleteLayer(composition, difficulty = "intermediate", style = "classical") {
  const layers = getPuzzleLayers(difficulty, style);
  for (const puzzleLayer of layers) {
    const apiLayer = composition.layers.find((l) => l.layerNumber === puzzleLayer.number);
    if (!apiLayer?.completed) {
      return puzzleLayer.number;
    }
  }

  return null;
}

/**
 * Returns 4 multiple-choice options for movement-3 puzzles.
 * One option is correct; the other 3 are the nearest distinct candidates
 * from the intermediate layer pool (transposed to rootMidi).
 *
 * Each option: { label: string, midi: number, isCorrect: boolean }
 *
 * @param {number} layerNumber 1–7
 * @param {number} rootMidi    MIDI root (60 = C)
 * @returns {{ label: string, midi: number, isCorrect: boolean }[]}
 */
export function getMultipleChoiceOptions(layerNumber, rootMidi = 60, style = "classical") {
  const NOTE_NAMES = ['C', 'C#/D\u266d', 'D', 'D#/E\u266d', 'E', 'F', 'F#/G\u266d', 'G', 'G#/A\u266d', 'A', 'A#/B\u266d', 'B'];
  const OCTAVE_LABELS = ['C', 'C\u266f', 'D', 'D\u266f', 'E', 'F', 'F\u266f', 'G', 'G\u266f', 'A', 'A\u266f', 'B'];

  function midiLabel(midi) {
    const pc = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    return `${OCTAVE_LABELS[pc]}${octave}`;
  }

  // All 7 transposed targets — use style-appropriate intermediate layers as the candidate pool
  const baseLayers = transposeLayers(getPuzzleLayers('intermediate', style), rootMidi);
  const correctLayer = baseLayers.find((l) => l.number === layerNumber);
  const correctMidi = correctLayer?.targetMidi ?? 60;

  // Candidates: all other target MIDIs
  const candidates = baseLayers
    .filter((l) => l.number !== layerNumber)
    .map((l) => l.targetMidi)
    .sort((a, b) => Math.abs(a - correctMidi) - Math.abs(b - correctMidi));

  // Pick the 3 closest distractors
  const distractors = candidates.slice(0, 3);

  const options = [
    { label: midiLabel(correctMidi), midi: correctMidi, isCorrect: true },
    ...distractors.map((m) => ({ label: midiLabel(m), midi: m, isCorrect: false }))
  ];

  // Fisher-Yates shuffle for random positioning
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return options;
}
