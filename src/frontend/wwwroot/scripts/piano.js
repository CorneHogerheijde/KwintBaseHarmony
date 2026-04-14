import { pianoKeyboard, selectedNoteLabel } from "./dom.js";
import { isBlackKey, midiToLabel, normalizeMidi, pianoRange } from "./music.js";

export function syncSelectedPitchDisplay(midi) {
  const normalized = normalizeMidi(midi);
  selectedNoteLabel.textContent = `${midiToLabel(normalized)} · MIDI ${normalized}`;

  for (const key of pianoKeyboard.querySelectorAll(".piano-key")) {
    key.classList.toggle("is-active", Number(key.dataset.midi) === normalized);
  }
}

export function renderPianoKeyboard(onSelect) {
  const fragment = document.createDocumentFragment();

  for (let midi = pianoRange.start; midi <= pianoRange.end; midi += 1) {
    const key = document.createElement("button");

    key.type = "button";
    key.className = `piano-key ${isBlackKey(midi) ? "black-key" : "white-key"}`;
    key.dataset.midi = String(midi);
    key.setAttribute("aria-label", `${midiToLabel(midi)} piano key`);
    key.innerHTML = `<span class="note-name">${midiToLabel(midi)}</span><span class="midi-label">${midi}</span>`;
    key.addEventListener("click", () => onSelect(midi));

    fragment.appendChild(key);
  }

  pianoKeyboard.replaceChildren(fragment);
}