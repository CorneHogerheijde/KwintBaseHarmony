import { playPreviewNote } from "./scripts/audio.js";
import { midiToLabel, normalizeMidi } from "./scripts/music.js";
import { renderPianoKeyboard, syncSelectedPitchDisplay } from "./scripts/piano.js";
import { renderNotation } from "./scripts/notation.js";
import { playLayer, playEverythingSoFar } from "./scripts/playback.js";
import {
  puzzleLayers,
  isCorrectNote,
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
const completionPanel = document.getElementById("completion-panel");
const playFullBtn = document.getElementById("play-full-btn");
const pianoKeyboard = document.getElementById("piano-keyboard");

// ── State ─────────────────────────────────────────────────────────────────────
const apiBase = "http://localhost:5000/api/compositions";
let composition = null;
let currentLayerNumber = null;
let selectedMidi = 60;
let correctNoteSelected = false;

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
  const pct = (completed / 7) * 100;
  progressFill.style.width = `${pct}%`;
  progressBar.setAttribute("aria-valuenow", String(completed));
  progressLabel.textContent = `${completed} of 7 layers complete`;
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
function onNoteSelected(midi, { preview = false } = {}) {
  selectedMidi = normalizeMidi(midi);
  syncSelectedPitchDisplay(selectedMidi);
  updateNotation();
  clearFeedback();

  if (preview) {
    playPreviewNote(selectedMidi, () => {});
  }

  correctNoteSelected = isCorrectNote(currentLayerNumber, selectedMidi);

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

  const puzzleLayer = puzzleLayers.find((l) => l.number === layerNumber);
  if (!puzzleLayer) return;

  layerNameEl.textContent = `Layer ${layerNumber} of 7 — ${puzzleLayer.name}`;
  promptEl.textContent = puzzleLayer.prompt;

  hintEl.textContent = puzzleLayer.hint;
  hintEl.classList.add("hidden");

  clearFeedback();
  clearHintKeys();

  const apiLayer = currentApiLayer();
  const isAlreadyCompleted = apiLayer?.completed ?? false;

  prevLayerBtn.disabled = layerNumber === 1;
  playAllBtn.disabled = layerNumber === 1;

  if (isAlreadyCompleted) {
    markCompleteBtn.disabled = true;
    showAnswerBtn.disabled = true;
    skipLayerBtn.textContent = "Back to Puzzle \u2192";
    skipLayerBtn.disabled = false;
    showFeedback("This layer is already complete. Click \"Back to Puzzle \u2192\" to resume.", true);
  } else {
    markCompleteBtn.disabled = true;
    showAnswerBtn.disabled = false;
    skipLayerBtn.textContent = "Skip Layer";
    skipLayerBtn.disabled = false;
  }

  updateProgress();
  updateNotation();

  puzzleCard.hidden = false;
  completionPanel.hidden = true;
}

// ── Show completion screen ────────────────────────────────────────────────────
function renderCompletion() {
  currentLayerNumber = null;
  puzzleCard.hidden = true;
  completionPanel.hidden = false;
  updateProgress();
}

// ── Advance to next layer (or completion) ─────────────────────────────────────
function advanceToNextLayer() {
  const nextLayerNumber = getFirstIncompleteLayer(composition);
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
  const puzzleLayer = puzzleLayers.find((l) => l.number === currentLayerNumber);
  if (!puzzleLayer) return;

  highlightHintKey(puzzleLayer.targetMidi);
  hintEl.classList.remove("hidden");
});

skipLayerBtn.addEventListener("click", async () => {
  if (!composition || !currentLayerNumber) return;

  // If navigated back to an already-completed layer, act as "Back to Puzzle"
  const apiLayerForSkip = currentApiLayer();
  if (apiLayerForSkip?.completed) {
    const nextLayerNumber = getFirstIncompleteLayer(composition);
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

playAllBtn.addEventListener("click", () => {
  if (composition) playEverythingSoFar(composition);
});

playFullBtn.addEventListener("click", () => {
  if (composition) playEverythingSoFar(composition);
});

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

  renderPianoKeyboard((midi) => onNoteSelected(midi, { preview: true }));
  onNoteSelected(60);

  const firstLayer = getFirstIncompleteLayer(composition);
  if (firstLayer === null) {
    renderCompletion();
  } else {
    renderLayer(firstLayer);
  }
}

void init();
