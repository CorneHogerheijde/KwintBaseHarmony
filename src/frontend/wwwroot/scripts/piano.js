import { pianoKeyboard, selectedNoteLabel } from "./dom.js";
import { isBlackKey, midiToLabel, normalizeMidi, pianoRange } from "./music.js";

// ── Key sizing constants ──────────────────────────────────────────────────────
const BASE_WHITE_KEY_W = 36;  // px at zoom 1.0
const BLACK_KEY_RATIO  = 0.58; // black key width as fraction of white key width
const KEY_GAP          = 2;    // px gap between white keys

let currentZoom    = 1.0;
let currentOnSelect = null;

function whiteKeyWidth() {
  return Math.round(BASE_WHITE_KEY_W * currentZoom);
}

// ── Zoom ──────────────────────────────────────────────────────────────────────
export function zoomIn()  { setZoom(currentZoom + 0.25); }
export function zoomOut() { setZoom(currentZoom - 0.25); }

function setZoom(zoom) {
  currentZoom = Math.max(0.4, Math.min(3.0, zoom));
  if (currentOnSelect) renderPianoKeyboard(currentOnSelect);
}

// ── Scroll viewport to centre a given key ────────────────────────────────────
export function scrollPianoToMidi(midi) {
  const viewport = pianoKeyboard.parentElement;
  const key      = pianoKeyboard.querySelector(`.piano-key[data-midi="${midi}"]`);
  if (!key || !viewport) return;

  const keyLeft  = parseFloat(key.style.left);
  const keyW     = parseFloat(key.style.width);
  viewport.scrollLeft = keyLeft + keyW / 2 - viewport.clientWidth / 2;
}

// ── Selected note display ─────────────────────────────────────────────────────
export function syncSelectedPitchDisplay(midi) {
  const normalized = normalizeMidi(midi);
  selectedNoteLabel.textContent = `${midiToLabel(normalized)} · MIDI ${normalized}`;

  for (const key of pianoKeyboard.querySelectorAll(".piano-key")) {
    key.classList.toggle("is-active", Number(key.dataset.midi) === normalized);
  }
}

// ── Render 88-key keyboard with absolute positioning ─────────────────────────
export function renderPianoKeyboard(onSelect) {
  currentOnSelect = onSelect;

  const ww       = whiteKeyWidth();
  const bw       = Math.round(ww * BLACK_KEY_RATIO);
  const fragment  = document.createDocumentFragment();
  let whiteIndex  = 0;

  for (let midi = pianoRange.start; midi <= pianoRange.end; midi++) {
    const isBlack = isBlackKey(midi);
    const label   = midiToLabel(midi);
    const key     = document.createElement("button");

    key.type      = "button";
    key.className = `piano-key ${isBlack ? "black-key" : "white-key"}`;
    key.dataset.midi = String(midi);
    key.setAttribute("aria-label", `${label} piano key`);

    // Show note name only on C keys to keep the keyboard uncluttered
    if (!isBlack && label.startsWith("C")) {
      key.innerHTML = `<span class="note-name">${label}</span>`;
    }

    key.addEventListener("click", () => onSelect(midi));

    key.style.position = "absolute";
    key.style.top      = "0";

    if (isBlack) {
      key.style.left   = `${whiteIndex * ww - bw / 2}px`;
      key.style.width  = `${bw}px`;
    } else {
      key.style.left   = `${whiteIndex * ww + KEY_GAP / 2}px`;
      key.style.width  = `${ww - KEY_GAP}px`;
      whiteIndex++;
    }

    fragment.appendChild(key);
  }

  // Size the container to exactly fit all white keys
  pianoKeyboard.style.width = `${whiteIndex * ww}px`;
  pianoKeyboard.replaceChildren(fragment);
}