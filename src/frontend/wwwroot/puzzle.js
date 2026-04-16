import { playPreviewNote } from "./scripts/audio.js";
import { midiToLabel, normalizeMidi, LAYER_COUNT } from "./scripts/music.js";
import { renderPianoKeyboard, syncSelectedPitchDisplay, scrollPianoToMidi, zoomIn, zoomOut } from "./scripts/piano.js";
import { renderNotation } from "./scripts/notation.js";
import { playLayer, playArpeggio } from "./scripts/playback.js";
import { renderCircleOfFifths } from "./scripts/circle-of-fifths.js";
import {
  getPuzzleLayers,
  isCorrectNote,
  isCorrectChord,
  transposeLayers,
  getFirstIncompleteLayer
} from "./scripts/puzzle-engine.js";

// ── DOM references ────────────────────────────────────────────────────────────
const compositionTitleLabel = document.getElementById("composition-title-label");
const progressBar = document.getElementById("puzzle-progress-bar");
const progressFill = document.getElementById("puzzle-progress-fill");
const progressLabel = document.getElementById("puzzle-progress-label");
const puzzleCard = document.getElementById("puzzle-card");
const layerNameEl = document.getElementById("puzzle-layer-name");
const promptEl = document.getElementById("puzzle-prompt");
const hintEl = document.getElementById("puzzle-hint");
const feedbackEl = document.getElementById("puzzle-feedback");
const feedbackText = document.getElementById("puzzle-feedback-text");
const markCompleteBtn = document.getElementById("mark-complete-btn");
const showAnswerBtn = document.getElementById("show-answer-btn");
const skipLayerBtn = document.getElementById("skip-layer-btn");
const prevLayerBtn = document.getElementById("prev-layer-btn");
const playAllBtn = document.getElementById("play-all-btn");
const arpeggioTempoInput = document.getElementById("arpeggio-tempo");
const arpeggioTempoLabel = document.getElementById("arpeggio-tempo-label");
const circleOfFifthsEl = document.getElementById("circle-of-fifths");
const pianoZoomInBtn  = document.getElementById("piano-zoom-in");
const pianoZoomOutBtn = document.getElementById("piano-zoom-out");
const pianoKeyboard   = document.getElementById("piano-keyboard");
const completionPanel = document.getElementById("completion-panel");

// ── State ─────────────────────────────────────────────────────────────────────
const apiBase = `${window.APP_CONFIG?.apiBase ?? "http://localhost:5000"}/api/compositions`;
let composition = null;
let difficulty = "intermediate";
let currentLayerNumber = null;
let selectedMidi = 60;
let correctNoteSelected = false;
let selectedChordMidis = [];
let rootMidi = 60;

// ── Helpers ───────────────────────────────────────────────────────────────────
function compositionUrl(path = "") {
  return `${apiBase}/${composition.id}${path}`;
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json();
}

function currentApiLayer() {
  return composition?.layers?.find((l) => l.layerNumber === currentLayerNumber) ?? null;
}

function countCompleted() {
  return composition?.layers?.filter((l) => l.completed).length ?? 0;
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function updateProgress() {
  const completed = countCompleted();
  const pct = (completed / LAYER_COUNT) * 100;
  progressFill.style.width = `${pct}%`;
  progressBar.setAttribute("aria-valuenow", String(completed));
  progressLabel.textContent = `${completed} of ${LAYER_COUNT} layers complete`;
}

// ── Notation ──────────────────────────────────────────────────────────────────
function updateNotation() {
  renderNotation(selectedMidi, composition);
}

// ── Piano key hint highlight ──────────────────────────────────────────────────
function clearHintKeys() {
  for (const key of pianoKeyboard.querySelectorAll(".is-hint")) {
    key.classList.remove("is-hint");
  }
}

function highlightHintKey(midi) {
  clearHintKeys();
  const key = pianoKeyboard.querySelector(`.piano-key[data-midi="${midi}"]`);
  if (key) key.classList.add("is-hint");
}

function highlightHintKeys(midis) {
  clearHintKeys();
  for (const m of midis) {
    const key = pianoKeyboard.querySelector(`.piano-key[data-midi="${m}"]`);
    if (key) key.classList.add("is-hint");
  }
}

function getActiveLayers() {
  return transposeLayers(getPuzzleLayers(difficulty), rootMidi);
}

// ── Feedback banner ───────────────────────────────────────────────────────────
function showFeedback(message, isSuccess) {
  feedbackText.textContent = message;
  feedbackEl.className = `puzzle-feedback ${isSuccess ? "puzzle-feedback--success" : "puzzle-feedback--wrong"}`;
  feedbackEl.hidden = false;
}

function clearFeedback() {
  feedbackEl.hidden = true;
  feedbackEl.className = "puzzle-feedback hidden";
}

// ── Note selection ────────────────────────────────────────────────────────────
function clearChordSelection() {
  selectedChordMidis = [];
  for (const key of pianoKeyboard.querySelectorAll(".is-selected")) {
    key.classList.remove("is-selected");
  }
}

function onNoteSelected(midi, { preview = false } = {}) {
  if (difficulty === "chords") {
    const normalizedMidi = normalizeMidi(midi);
    if (preview) playPreviewNote(normalizedMidi, () => {});
    const key = pianoKeyboard.querySelector(`.piano-key[data-midi="${normalizedMidi}"]`);
    const idx = selectedChordMidis.indexOf(normalizedMidi);
    if (idx === -1) {
      selectedChordMidis.push(normalizedMidi);
      if (key) key.classList.add("is-selected");
    } else {
      selectedChordMidis.splice(idx, 1);
      if (key) key.classList.remove("is-selected");
    }
    syncSelectedPitchDisplay(normalizedMidi);
    clearFeedback();
    updateNotation();
    return;
  }

  selectedMidi = normalizeMidi(midi);
  syncSelectedPitchDisplay(selectedMidi);
  updateNotation();
  clearFeedback();

  if (preview) {
    playPreviewNote(selectedMidi, () => {});
  }

  correctNoteSelected = getActiveLayers().find((l) => l.number === currentLayerNumber)?.targetMidi === selectedMidi;

  if (correctNoteSelected) {
    showFeedback(`Correct! ${midiToLabel(selectedMidi)} is the right note. Click "Mark Layer Complete" to continue.`, true);
    markCompleteBtn.disabled = false;
  } else {
    markCompleteBtn.disabled = true;
  }
}

// ── Render puzzle for a given layer ──────────────────────────────────────────
function renderLayer(layerNumber) {
  currentLayerNumber = layerNumber;
  correctNoteSelected = false;

  const layers = getActiveLayers();
  const puzzleLayer = layers.find((l) => l.number === layerNumber);
  if (!puzzleLayer) return;

  layerNameEl.textContent = `Layer ${layerNumber} of ${LAYER_COUNT} — ${puzzleLayer.name}`;
  promptEl.textContent = puzzleLayer.prompt;

  hintEl.textContent = puzzleLayer.hint;
  if (puzzleLayer.autoHint) {
    hintEl.classList.remove("hidden");
    showAnswerBtn.hidden = true;
  } else {
    hintEl.classList.add("hidden");
    showAnswerBtn.hidden = false;
  }

  clearFeedback();
  clearHintKeys();

  const apiLayer = currentApiLayer();
  const isAlreadyCompleted = apiLayer?.completed ?? false;

  prevLayerBtn.disabled = layerNumber === 1;
  playAllBtn.disabled   = layerNumber === 1;

  if (isAlreadyCompleted) {
    markCompleteBtn.hidden = false;
    markCompleteBtn.disabled = true;
    submitChordBtn.hidden = true;
    showAnswerBtn.disabled = true;
    skipLayerBtn.textContent = "Back to Puzzle \u2192";
    skipLayerBtn.disabled = false;
    showFeedback("This layer is already complete. Click \"Back to Puzzle \u2192\" to resume.", true);
  } else {
    if (difficulty === "chords") {
      markCompleteBtn.hidden = true;
      submitChordBtn.hidden = false;
      submitChordBtn.disabled = false;
      clearChordSelection();
    } else {
      markCompleteBtn.hidden = false;
      markCompleteBtn.disabled = true;
      submitChordBtn.hidden = true;
    }
    showAnswerBtn.disabled = false;
    skipLayerBtn.textContent = "Skip Layer";
    skipLayerBtn.disabled = false;
  }

  updateProgress();
  updateNotation();

  if (circleOfFifthsEl) renderCircleOfFifths(circleOfFifthsEl, puzzleLayer.targetMidis?.[0] ?? puzzleLayer.targetMidi, rootMidi);
  scrollPianoToMidi(puzzleLayer.targetMidis?.[0] ?? puzzleLayer.targetMidi);

  const explanationEl = document.getElementById("layer-explanation");
  if (explanationEl) explanationEl.textContent = puzzleLayer.explanation ?? "";

  puzzleCard.hidden = false;
}

// ── Render completion panel ───────────────────────────────────────────────────
function renderCompletion() {
  currentLayerNumber = null;
  puzzleCard.hidden = true;
  completionPanel.hidden = false;
  updateProgress();
}

// ── Advance to next layer (or completion) ─────────────────────────────────────
function advanceToNextLayer() {
  const nextLayerNumber = getFirstIncompleteLayer(composition, difficulty);
  if (nextLayerNumber === null) {
    renderCompletion();
  } else {
    renderLayer(nextLayerNumber);
  }
}

// ── Button handlers ───────────────────────────────────────────────────────────
markCompleteBtn.addEventListener("click", async () => {
  if (!correctNoteSelected || !composition || !currentLayerNumber) return;

  markCompleteBtn.disabled = true;
  showAnswerBtn.disabled = true;
  skipLayerBtn.disabled = true;

  try {
    // Add the note to the layer, then mark the layer complete
    await apiRequest(compositionUrl(`/layers/${currentLayerNumber}/notes`), {
      method: "POST",
      body: JSON.stringify({
        pitch: selectedMidi,
        durationMs: 500,
        timingMs: 0,
        velocity: 100
      })
    });

    composition = await apiRequest(compositionUrl(`/layers/${currentLayerNumber}/complete`), {
      method: "POST"
    });

    // Play the layer back before advancing
    const completedLayer = composition.layers.find((l) => l.layerNumber === currentLayerNumber);
    if (completedLayer) {
      playLayer(completedLayer);
    }

    advanceToNextLayer();
  } catch (error) {
    showFeedback(`Error: ${error.message}`, false);
    markCompleteBtn.disabled = false;
    showAnswerBtn.disabled = false;
    skipLayerBtn.disabled = false;
  }
});

showAnswerBtn.addEventListener("click", () => {
  const layers = getActiveLayers();
  const puzzleLayer = layers.find((l) => l.number === currentLayerNumber);
  if (!puzzleLayer) return;

  if (puzzleLayer.targetMidis) {
    highlightHintKeys(puzzleLayer.targetMidis);
  } else {
    highlightHintKey(puzzleLayer.targetMidi);
  }
  hintEl.classList.remove("hidden");
});

submitChordBtn.addEventListener("click", async () => {
  if (!composition || !currentLayerNumber) return;

  const correct = isCorrectChord(currentLayerNumber, selectedChordMidis, difficulty);
  if (!correct) { () => {
  if (!composition || !currentLayerNumber) return;

  const correct = isCorrectChord(currentLayerNumber, selectedChordMidis, difficulty);
  if (!correct) {
    showFeedback("Not quite — try again. Select all the required notes and click Submit chord.", false);
    return;
  }

  submitChordBtn.disabled = true;
  skipLayerBtn.disabled = true;
  showAnswerBtn.disabled = true;

  try {
    for (const pitch of selectedChordMidis) {
      await apiRequest(compositionUrl(`/layers/${currentLayerNumber}/notes`), {
        method: "POST",
        body: JSON.stringify({ pitch, durationMs: 500, timingMs: 0, velocity: 100 })
      });
    }

    composition = await apiRequest(compositionUrl(`/layers/${currentLayerNumber}/complete`), {
      method: "POST"
    });

    const completedLayer = composition.layers.find((l) => l.layerNumber === currentLayerNumber);
    if (completedLayer) playLayer(completedLayer);

    clearChordSelection();
    advanceToNextLayer();
  } catch (error) {
    showFeedback(`Error: ${error.message}`, false);
    submitChordBtn.disabled = false;
    skipLayerBtn.disabled = false;
    showAnswerBtn.disabled = false;
  }
});

skipLayerBtn.addEventListener("click", async () => {
  if (!composition || !currentLayerNumber) return;

  // If navigated back to an already-completed layer, act as "Back to Puzzle"
  const apiLayerForSkip = currentApiLayer();
  if (apiLayerForSkip?.completed) {
    const nextLayerNumber = getFirstIncompleteLayer(composition, difficulty);
    if (nextLayerNumber === null) renderCompletion();
    else renderLayer(nextLayerNumber);
    return;
  }

  skipLayerBtn.disabled = true;
  markCompleteBtn.disabled = true;
  showAnswerBtn.disabled = true;

  try {
    composition = await apiRequest(compositionUrl(`/layers/${currentLayerNumber}/complete`), {
      method: "POST"
    });

    advanceToNextLayer();
  } catch (error) {
    showFeedback(`Error: ${error.message}`, false);
    skipLayerBtn.disabled = false;
    markCompleteBtn.disabled = false;
    showAnswerBtn.disabled = false;
  }
});

prevLayerBtn.addEventListener("click", () => {
  if (currentLayerNumber && currentLayerNumber > 1) {
    renderLayer(currentLayerNumber - 1);
  }
});

arpeggioTempoInput?.addEventListener("input", () => {
  if (arpeggioTempoLabel) arpeggioTempoLabel.textContent = `${arpeggioTempoInput.value} BPM`;
});

playAllBtn.addEventListener("click", () => {
  if (composition) playArpeggio(composition, Number(arpeggioTempoInput?.value ?? 72));
});

pianoZoomInBtn?.addEventListener("click",  () => zoomIn());
pianoZoomOutBtn?.addEventListener("click", () => zoomOut());

// ── Initialise ────────────────────────────────────────────────────────────────
async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    promptEl.textContent = "No composition ID in URL. Please go back to the dashboard.";
    return;
  }

  try {
    composition = await apiRequest(`${apiBase}/${id}`);
  } catch (error) {
    promptEl.textContent = `Could not load composition: ${error.message}`;
    return;
  }

  compositionTitleLabel.textContent = `${composition.title} · ${composition.studentId}`;
  difficulty = composition.difficulty ?? "intermediate";

  document.getElementById("root-note-select").addEventListener("change", (e) => {
    rootMidi = parseInt(e.target.value, 10);
    if (currentLayerNumber !== null) renderLayer(currentLayerNumber);
  });

  renderPianoKeyboard((midi) => onNoteSelected(midi, { preview: true }));
  onNoteSelected(60);

  const firstLayer = getFirstIncompleteLayer(composition, difficulty);
  if (firstLayer === null) {
    renderCompletion();
  } else {
    renderLayer(firstLayer);
  }
}

void init();
