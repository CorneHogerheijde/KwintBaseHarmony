import { midiToFrequency } from "./music.js";

let audioContext = null;

function ensureAudioContext() {
  if (!audioContext) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioContext = new AC();
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  return audioContext;
}

/**
 * Schedules a single note on the Web Audio graph.
 * @param {AudioContext} context
 * @param {number} midi MIDI note number
 * @param {number} startTime AudioContext time in seconds
 * @param {number} durationSecs Note duration in seconds
 */
function scheduleNote(context, midi, startTime, durationSecs) {
  const freq = midiToFrequency(midi);

  const osc = context.createOscillator();
  const harmonic = context.createOscillator();
  const gain = context.createGain();
  const harmonicGain = context.createGain();
  const filter = context.createBiquadFilter();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, startTime);

  harmonic.type = "sine";
  harmonic.frequency.setValueAtTime(freq * 2, startTime);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, startTime);

  const attack = 0.02;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.18, startTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSecs);

  harmonicGain.gain.setValueAtTime(0.0001, startTime);
  harmonicGain.gain.exponentialRampToValueAtTime(0.05, startTime + attack);
  harmonicGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSecs * 0.85);

  osc.connect(gain);
  harmonic.connect(harmonicGain);
  gain.connect(filter);
  harmonicGain.connect(filter);
  filter.connect(context.destination);

  osc.start(startTime);
  harmonic.start(startTime);
  osc.stop(startTime + durationSecs + 0.05);
  harmonic.stop(startTime + durationSecs + 0.05);
}

/**
 * Plays all notes in a single layer in sequence, ordered by timingMs.
 * No-ops if the layer has no notes.
 * @param {{ notes: Array<{pitch:number, durationMs:number, timingMs:number}> }} layer
 */
export function playLayer(layer) {
  const context = ensureAudioContext();
  if (!context || !layer.notes || layer.notes.length === 0) return;

  const now = context.currentTime;
  const sorted = [...layer.notes].sort((a, b) => a.timingMs - b.timingMs);

  for (const note of sorted) {
    const startTime = now + note.timingMs / 1000;
    const durationSecs = Math.max(0.3, note.durationMs / 1000);
    scheduleNote(context, note.pitch, startTime, durationSecs);
  }
}

/**
 * Plays all notes from all layers of the composition simultaneously as a chord.
 * No-ops if the composition has no notes at all.
 * @param {{ layers: Array<{notes: Array<{pitch:number}>}> }} composition
 */
export function playEverythingSoFar(composition) {
  const context = ensureAudioContext();
  if (!context) return;

  const allNotes = composition.layers.flatMap((l) => l.notes ?? []);
  if (allNotes.length === 0) return;

  const now = context.currentTime;
  for (const note of allNotes) {
    scheduleNote(context, note.pitch, now, 1.6);
  }
}

/**
 * Plays one note per completed layer in layer order, spaced by one beat.
 * Takes the first note of each layer (by timingMs) as the layer's representative pitch.
 * No-ops if no layers have notes.
 * @param {{ layers: Array<{notes: Array<{pitch:number, timingMs:number}>}> }} composition
 * @param {number} [bpm=72] Beats per minute — controls spacing between notes
 */
export function playArpeggio(composition, bpm = 72) {
  const context = ensureAudioContext();
  if (!context) return;

  const beatSecs = 60 / bpm;
  // One representative note per layer: the note with the lowest timingMs
  const pitches = composition.layers
    .map((l) => {
      const notes = l.notes ?? [];
      if (notes.length === 0) return null;
      return [...notes].sort((a, b) => a.timingMs - b.timingMs)[0].pitch;
    })
    .filter((p) => p !== null);

  if (pitches.length === 0) return;

  const noteDuration = beatSecs * 0.9; // slight staccato — 90% of beat
  const now = context.currentTime;

  pitches.forEach((pitch, i) => {
    scheduleNote(context, pitch, now + i * beatSecs, noteDuration);
  });
}
