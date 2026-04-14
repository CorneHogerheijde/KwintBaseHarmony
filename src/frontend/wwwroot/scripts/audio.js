import { midiToFrequency } from "./music.js";

let audioContext = null;

function ensureAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  return audioContext;
}

export function playPreviewNote(midi, log) {
  const context = ensureAudioContext();
  if (!context) {
    log("Web Audio is not available in this browser.");
    return;
  }

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const harmonic = context.createOscillator();
  const gain = context.createGain();
  const harmonicGain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(midiToFrequency(midi), now);

  harmonic.type = "sine";
  harmonic.frequency.setValueAtTime(midiToFrequency(midi) * 2, now);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

  harmonicGain.gain.setValueAtTime(0.0001, now);
  harmonicGain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
  harmonicGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

  oscillator.connect(gain);
  harmonic.connect(harmonicGain);
  gain.connect(filter);
  harmonicGain.connect(filter);
  filter.connect(context.destination);

  oscillator.start(now);
  harmonic.start(now);
  oscillator.stop(now + 0.6);
  harmonic.stop(now + 0.6);
}