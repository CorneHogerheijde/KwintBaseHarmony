import { playPreviewNote } from "./scripts/audio.js";
import { midiToLabel, normalizeMidi, LAYER_COUNT } from "./scripts/music.js";
import { renderPianoKeyboard, syncSelectedPitchDisplay, scrollPianoToMidi, zoomIn, zoomOut } from "./scripts/piano.js";
import { renderNotation } from "./scripts/notation.js";
import { playLayer, playArpeggio } from "./scripts/playback.js";
import { renderAuthNav } from "./scripts/nav-auth.js";
renderAuthNav("auth-nav");
import { renderCircleOfFifths } from "./scripts/circle-of-fifths.js";
import { request } from "./scripts/api.js";
import {
  getPuzzleLayers,
  isCorrectNote,
  isCorrectChord,
  transposeLayers,
  getFirstIncompleteLayer,
  getMultipleChoiceOptions
} from "./scripts/puzzle-engine.js";

// ── DOM references ────────────────────────────────────────────────────────────
const compositionTitleLabel = document.getElementById("composition-title-label");
const progressLink = document.getElementById("progress-link");
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
const submitChordBtn = document.getElementById("submit-chord-btn");
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
const continueMovementBtn = document.getElementById("continue-movement-btn");
const multipleChoiceOptionsEl = document.getElementById("multiple-choice-options");
const pianoSectionEl = document.getElementById("piano-section");
const setRootBtn      = document.getElementById("set-root-btn");
const rootNoteLabel   = document.getElementById("root-note-label");

// ── State ─────────────────────────────────────────────────────────────────────
let composition = null;
let difficulty = "intermediate";
let movementNumber = 1;
let currentLayerNumber = null;
let selectedMidi = 60;
let correctNoteSelected = false;
let selectedChordMidis = [];
let rootMidi = 60;
let rootSelectionMode = false;
let style = "classical";
let layerStartTime = null;
let layerWrongAttempts = 0;

// ── Helpers ───────────────────────────────────────────────────────────────────
function compositionUrl(path = "") {
  return `/${composition.id}${path}`;
}

function currentApiLayer() {
  return composition?.layers?.find((l) => l.layerNumber === currentLayerNumber) ?? null;
}

function countCompleted() {
  return composition?.layers?.filter((l) => l.completed).length ?? 0;
}

function updateRootLabel() {
  const name = midiToLabel(rootMidi).replace(/\d+$/, "");
  if (rootNoteLabel) rootNoteLabel.textContent = `Root: ${name}`;
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
  renderNotation(selectedMidi, composition, rootMidi);
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
  return transposeLayers(getPuzzleLayers(difficulty, style), rootMidi);
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
  // Root-selection mode: the next key click sets the root note
  if (rootSelectionMode) {
    rootMidi = midi;
    rootSelectionMode = false;
    setRootBtn.textContent = "Change Root";
    setRootBtn.classList.remove("is-active");
    updateRootLabel();
    // Persist the new transposition to the backend (fire-and-forget)
    if (composition) {
      request(compositionUrl("/root-midi"), {
        method: "PATCH",
        body: JSON.stringify({ rootMidi })
      }).catch((err) => console.warn("Failed to save rootMidi:", err));
    }
    if (currentLayerNumber !== null) {
      renderLayer(currentLayerNumber);
      // Re-evaluate the current selection against the new transposition
      // so the user doesn't need to re-click what they already had selected.
      const activeLayers = getActiveLayers();
      const puzzleLayer = activeLayers.find((l) => l.number === currentLayerNumber);
      if (puzzleLayer && !currentApiLayer()?.completed) {
        if (difficulty === "chords") {
          // Re-highlight any keys that are still selected
          for (const m of selectedChordMidis) {
            const key = pianoKeyboard.querySelector(`.piano-key[data-midi="${m}"]`);
            if (key) key.classList.add("is-selected");
          }
        } else {
          // Silently recheck the note the user already has selected
          correctNoteSelected = puzzleLayer.targetMidi === selectedMidi;
          if (correctNoteSelected) {
            showFeedback(`Correct! ${midiToLabel(selectedMidi)} is the right note. Click "Mark Layer Complete" to continue.`, true);
            markCompleteBtn.disabled = false;
          }
        }
      }
    }
    return;
  }

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
    layerWrongAttempts++;
    markCompleteBtn.disabled = true;
  }
}

// ── Render puzzle for a given layer ──────────────────────────────────────────
function renderLayer(layerNumber) {
  currentLayerNumber = layerNumber;
  correctNoteSelected = false;
  layerStartTime = Date.now();
  layerWrongAttempts = 0;

  const layers = getActiveLayers();
  const puzzleLayer = layers.find((l) => l.number === layerNumber);
  if (!puzzleLayer) return;

  layerNameEl.textContent = `Layer ${layerNumber} of ${LAYER_COUNT} — ${puzzleLayer.name}`;
  promptEl.textContent = puzzleLayer.prompt;

  hintEl.textContent = puzzleLayer.hint;
  if (puzzleLayer.autoHint) {
    hintEl.classList.remove("hidden");
  } else {
    hintEl.classList.add("hidden");
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
    showAnswerBtn.hidden = false;
    showAnswerBtn.disabled = false;
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
    showAnswerBtn.hidden = puzzleLayer.autoHint;
    showAnswerBtn.disabled = false;
    skipLayerBtn.textContent = "Skip Layer";
    skipLayerBtn.disabled = false;
  }

  updateProgress();
  updateNotation();

  if (circleOfFifthsEl) renderCircleOfFifths(circleOfFifthsEl, puzzleLayer.targetMidis?.[0] ?? puzzleLayer.targetMidi, rootMidi);
  scrollPianoToMidi(puzzleLayer.targetMidis?.[0] ?? puzzleLayer.targetMidi);

  // ── Multiple-choice mode (movement 3) ──────────────────────────────────────
  if (movementNumber === 3 && !isAlreadyCompleted) {
    if (pianoSectionEl) pianoSectionEl.hidden = true;
    if (multipleChoiceOptionsEl) {
      multipleChoiceOptionsEl.classList.remove("hidden");
      renderMultipleChoiceOptions(layerNumber);
    }
    markCompleteBtn.hidden = true;
    submitChordBtn.hidden = true;
    showAnswerBtn.hidden = true;
  } else if (movementNumber === 3 && isAlreadyCompleted) {
    if (pianoSectionEl) pianoSectionEl.hidden = true;
    if (multipleChoiceOptionsEl) multipleChoiceOptionsEl.classList.add("hidden");
  } else {
    if (pianoSectionEl) pianoSectionEl.hidden = false;
    if (multipleChoiceOptionsEl) multipleChoiceOptionsEl.classList.add("hidden");
  }

  const explanationEl = document.getElementById("layer-explanation");
  if (explanationEl) explanationEl.textContent = puzzleLayer.explanation ?? "";

  const rootNoteEl = document.getElementById("layer-root-note");
  if (rootNoteEl) {
    const rootName = midiToLabel(rootMidi).replace(/\d+$/, "");
    rootNoteEl.textContent = rootMidi === 60
      ? `Playing in the default key of C.`
      : `Transposed to root: ${rootName}. Note names in the explanation above refer to the default key of C.`;
  }

  puzzleCard.hidden = false;
}

// ── Multiple-choice renderer (movement 3) ─────────────────────────────────────
function renderMultipleChoiceOptions(layerNumber) {
  if (!multipleChoiceOptionsEl) return;
  multipleChoiceOptionsEl.innerHTML = "";

  const options = getMultipleChoiceOptions(layerNumber, rootMidi, style);

  for (const option of options) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mc-option-btn";
    btn.textContent = option.label;
    btn.dataset.midi = String(option.midi);
    btn.dataset.correct = option.isCorrect ? "true" : "false";

    btn.addEventListener("click", () => handleMultipleChoiceClick(btn, option));
    multipleChoiceOptionsEl.appendChild(btn);
  }
}

async function handleMultipleChoiceClick(btn, option) {
  if (!composition || !currentLayerNumber) return;

  // Prevent double-click
  for (const b of multipleChoiceOptionsEl.querySelectorAll(".mc-option-btn")) {
    b.disabled = true;
  }

  if (option.isCorrect) {
    btn.classList.add("mc-correct");
    showFeedback(`Correct! ${option.label} is right. Moving to the next layer…`, true);

    try {
      await request(compositionUrl(`/layers/${currentLayerNumber}/notes`), {
        method: "POST",
        body: JSON.stringify({ pitch: option.midi, durationMs: 500, timingMs: 0, velocity: 100 })
      });
      composition = await request(compositionUrl(`/layers/${currentLayerNumber}/complete`), {
        method: "POST",
        body: JSON.stringify({ attempts: layerWrongAttempts + 1, firstTryCorrect: layerWrongAttempts === 0, timeSpentMs: layerStartTime ? Date.now() - layerStartTime : null })
      });
      const completedLayer = composition.layers.find((l) => l.layerNumber === currentLayerNumber);
      if (completedLayer) playLayer(completedLayer);

      setTimeout(() => advanceToNextLayer(), 700);
    } catch (error) {
      showFeedback(`Error: ${error.message}`, false);
      for (const b of multipleChoiceOptionsEl.querySelectorAll(".mc-option-btn")) {
        b.disabled = false;
      }
    }
  } else {
    btn.classList.add("mc-incorrect");
    layerWrongAttempts++;
    showFeedback("Not quite — try again!", false);
    setTimeout(() => {
      btn.classList.remove("mc-incorrect");
      for (const b of multipleChoiceOptionsEl.querySelectorAll(".mc-option-btn")) {
        b.disabled = false;
      }
    }, 900);
  }
}

// ── Render completion panel ───────────────────────────────────────────────────
function renderCompletion() {
  currentLayerNumber = null;
  puzzleCard.hidden = true;
  if (multipleChoiceOptionsEl) multipleChoiceOptionsEl.classList.add("hidden");
  if (pianoSectionEl) pianoSectionEl.hidden = true;
  completionPanel.hidden = false;

  const headingEl = document.getElementById("completion-heading");
  const ledeEl = document.getElementById("completion-lede");
  const movementRoman = ["", "I", "II", "III"][movementNumber] ?? movementNumber;

  if (headingEl) headingEl.textContent = `Movement ${movementRoman} complete!`;
  if (ledeEl) {
    ledeEl.textContent = movementNumber < 3
      ? `You have completed all 7 layers of Movement ${movementRoman}. Ready to continue?`
      : "You have completed all three movements. Your full piece is done!";
  }

  if (continueMovementBtn) {
    if (movementNumber < 3) {
      const nextRoman = ["", "I", "II", "III"][movementNumber + 1] ?? (movementNumber + 1);
      continueMovementBtn.textContent = `Continue to Movement ${nextRoman} \u2192`;
      continueMovementBtn.hidden = false;
    } else {
      continueMovementBtn.hidden = true;
    }
  }

  updateProgress();
}

// ── Advance to next layer (or completion) ─────────────────────────────────────
function advanceToNextLayer() {
  const nextLayerNumber = getFirstIncompleteLayer(composition, difficulty, style);
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
    await request(compositionUrl(`/layers/${currentLayerNumber}/notes`), {
      method: "POST",
      body: JSON.stringify({
        pitch: selectedMidi,
        durationMs: 500,
        timingMs: 0,
        velocity: 100
      })
    });

    composition = await request(compositionUrl(`/layers/${currentLayerNumber}/complete`), {
      method: "POST",
      body: JSON.stringify({ attempts: layerWrongAttempts + 1, firstTryCorrect: layerWrongAttempts === 0, timeSpentMs: layerStartTime ? Date.now() - layerStartTime : null })
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

  const activeLayers = getActiveLayers();
  const puzzleLayer = activeLayers.find((l) => l.number === currentLayerNumber);
  if (!puzzleLayer?.targetMidis) return;

  const sortedSelected = [...selectedChordMidis].sort((a, b) => a - b);
  const sortedTarget = [...puzzleLayer.targetMidis].sort((a, b) => a - b);
  const correct = sortedSelected.length === sortedTarget.length && sortedSelected.every((m, i) => m === sortedTarget[i]);

  if (!correct) {
    showFeedback("Not quite — try again. Select all the required notes and click Submit chord.", false);
    layerWrongAttempts++;
    return;
  }

  submitChordBtn.disabled = true;
  skipLayerBtn.disabled = true;
  showAnswerBtn.disabled = true;

  try {
    for (const pitch of selectedChordMidis) {
      await request(compositionUrl(`/layers/${currentLayerNumber}/notes`), {
        method: "POST",
        body: JSON.stringify({ pitch, durationMs: 500, timingMs: 0, velocity: 100 })
      });
    }

    composition = await request(compositionUrl(`/layers/${currentLayerNumber}/complete`), {
      method: "POST",
      body: JSON.stringify({ attempts: layerWrongAttempts + 1, firstTryCorrect: layerWrongAttempts === 0, timeSpentMs: layerStartTime ? Date.now() - layerStartTime : null })
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
    const nextLayerNumber = getFirstIncompleteLayer(composition, difficulty, style);
    if (nextLayerNumber === null) renderCompletion();
    else renderLayer(nextLayerNumber);
    return;
  }

  skipLayerBtn.disabled = true;
  markCompleteBtn.disabled = true;
  showAnswerBtn.disabled = true;

  try {
    composition = await request(compositionUrl(`/layers/${currentLayerNumber}/complete`), {
      method: "POST",
      body: JSON.stringify({ timeSpentMs: layerStartTime ? Date.now() - layerStartTime : null })
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

continueMovementBtn?.addEventListener("click", async () => {
  if (!composition) return;
  continueMovementBtn.disabled = true;

  try {
    const next = await request(`/${composition.id}/movements`, { method: "POST" });
    window.location.href = `/puzzle.html?id=${next.id}`;
  } catch (error) {
    showFeedback(`Could not start next movement: ${error.message}`, false);
    continueMovementBtn.disabled = false;
  }
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
    composition = await request(`/${id}`);
  } catch (error) {
    promptEl.textContent = `Could not load composition: ${error.message}`;
    return;
  }

  compositionTitleLabel.textContent = `${composition.title} · ${composition.studentId}`;
  if (progressLink) {
    progressLink.href = `/progress.html?id=${encodeURIComponent(composition.id)}`;
    progressLink.classList.remove("hidden");
  }
  difficulty = composition.difficulty ?? "intermediate";
  style = composition.style ?? "classical";
  rootMidi = composition.rootMidi ?? 60;
  movementNumber = composition.movementNumber ?? 1;

  // Show style badge when style is not classical
  const existingBadge = document.getElementById("style-badge");
  if (existingBadge) existingBadge.remove();
  if (style !== "classical") {
    const badge = document.createElement("span");
    badge.id = "style-badge";
    badge.className = `style-badge style-badge--${style}`;
    badge.textContent = style.charAt(0).toUpperCase() + style.slice(1);
    compositionTitleLabel.insertAdjacentElement("afterend", badge);
  }

  setRootBtn?.addEventListener("click", () => {
    rootSelectionMode = true;
    setRootBtn.textContent = "Click a key to set root\u2026";
    setRootBtn.classList.add("is-active");
  });

  updateRootLabel();

  renderPianoKeyboard((midi) => onNoteSelected(midi, { preview: true }));
  onNoteSelected(60);

  const firstLayer = getFirstIncompleteLayer(composition, difficulty, style);
  if (firstLayer === null) {
    renderCompletion();
  } else {
    renderLayer(firstLayer);
  }
}

void init();
