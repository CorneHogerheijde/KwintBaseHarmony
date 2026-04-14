import {
  addNoteForm,
  apiBaseUrl,
  clearJsonEditorButton,
  compositionIdInput,
  createForm,
  exportJsonButton,
  exportMidiButton,
  importJsonButton,
  jsonEditor,
  loadForm,
  loadJsonIntoEditorButton,
  notationClefSelect,
  pitchInput,
  previewSelectedNoteButton,
  refreshStatusButton
} from "./scripts/dom.js";
import { playPreviewNote } from "./scripts/audio.js";
import { request, checkBackendStatus } from "./scripts/api.js";
import { getEditorJson, setCurrentComposition, setEditorJson } from "./scripts/composition-ui.js";
import { log } from "./scripts/logging.js";
import { setupMidiInput } from "./scripts/midi.js";
import { midiToLabel, normalizeMidi } from "./scripts/music.js";
import { renderNotation } from "./scripts/notation.js";
import { renderPianoKeyboard, syncSelectedPitchDisplay } from "./scripts/piano.js";

let currentComposition = null;

function updateNotation() {
  renderNotation(Number(pitchInput.value), currentComposition);
}

function applyCurrentComposition(composition) {
  currentComposition = composition;
  setCurrentComposition(composition, updateNotation);
}

function setSelectedPitch(midi, { preview = false } = {}) {
  const normalized = normalizeMidi(midi);
  pitchInput.value = normalized;
  syncSelectedPitchDisplay(normalized);
  updateNotation();

  if (preview) {
    playPreviewNote(normalized, log);
  }
}

async function loadCompositionById(id) {
  const composition = await request(`/${id}`);
  applyCurrentComposition(composition);
  log("Loaded composition", composition);
}

async function exportCurrentCompositionJson({ logResult = true } = {}) {
  if (!currentComposition) {
    return null;
  }

  const raw = await request(`/${currentComposition.id}/export/json`);
  const formatted = typeof raw === "string"
    ? JSON.stringify(JSON.parse(raw), null, 2)
    : JSON.stringify(raw, null, 2);

  setEditorJson(formatted);

  if (logResult) {
    log("Exported composition JSON into editor", { compositionId: currentComposition.id });
  }

  return formatted;
}

createForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(createForm);
  const payload = {
    studentId: formData.get("studentId"),
    title: formData.get("title"),
    difficulty: formData.get("difficulty")
  };

  try {
    const composition = await request("", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    applyCurrentComposition(composition);
    log("Created composition", composition);
  } catch (error) {
    log("Failed to create composition", { error: error.message });
  }
});

loadForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = compositionIdInput.value.trim();
  if (!id) {
    return;
  }

  try {
    await loadCompositionById(id);
  } catch (error) {
    applyCurrentComposition(null);
    log("Failed to load composition", { error: error.message, id });
  }
});

addNoteForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentComposition) {
    log("No composition loaded. Create or load a composition first.");
    return;
  }

  const formData = new FormData(addNoteForm);
  const layerNumber = Number(formData.get("layerNumber"));
  const velocityValue = formData.get("velocity");
  const payload = {
    pitch: Number(formData.get("pitch")),
    durationMs: Number(formData.get("durationMs")),
    timingMs: Number(formData.get("timingMs")),
    velocity: velocityValue === "" ? null : Number(velocityValue)
  };

  try {
    const updated = await request(`/${currentComposition.id}/layers/${layerNumber}/notes`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    applyCurrentComposition(updated);
    log(`Added note to layer ${layerNumber}`, payload);
  } catch (error) {
    log("Failed to add note", { error: error.message, payload });
  }
});

exportJsonButton.addEventListener("click", async () => {
  if (!currentComposition) {
    return;
  }

  try {
    await exportCurrentCompositionJson();
  } catch (error) {
    log("Failed to export JSON", { error: error.message });
  }
});

exportMidiButton.addEventListener("click", async () => {
  if (!currentComposition) {
    return;
  }

  const url = `${apiBaseUrl}/${currentComposition.id}/export/midi`;
  window.open(url, "_blank", "noopener,noreferrer");
  log("Opened MIDI export", { url });
});

previewSelectedNoteButton.addEventListener("click", () => {
  const midi = Number(pitchInput.value);
  playPreviewNote(midi, log);
  log("Previewed selected note", { midi, note: midiToLabel(midi) });
});

refreshStatusButton.addEventListener("click", () => {
  void checkBackendStatus();
});

loadJsonIntoEditorButton.addEventListener("click", async () => {
  if (!currentComposition) {
    return;
  }

  try {
    await exportCurrentCompositionJson();
  } catch (error) {
    log("Failed to load current composition JSON", { error: error.message });
  }
});

clearJsonEditorButton.addEventListener("click", () => {
  setEditorJson("");
  log("Cleared JSON editor.");
});

pitchInput.addEventListener("input", () => {
  syncSelectedPitchDisplay(pitchInput.value);
});

pitchInput.addEventListener("change", () => {
  setSelectedPitch(pitchInput.value);
});

notationClefSelect.addEventListener("change", () => {
  updateNotation();
});

importJsonButton.addEventListener("click", async () => {
  const json = getEditorJson();
  if (!json) {
    log("Import skipped because the JSON editor is empty.");
    return;
  }

  try {
    JSON.parse(json);
  } catch (error) {
    log("Import blocked due to invalid JSON syntax.", { error: error.message });
    return;
  }

  try {
    const imported = await request("/import/json", {
      method: "POST",
      body: JSON.stringify({ json })
    });

    applyCurrentComposition(imported);
    await exportCurrentCompositionJson({ logResult: false });
    log("Imported composition JSON from editor", { compositionId: imported.id });
  } catch (error) {
    log("Failed to import JSON", { error: error.message });
  }
});

renderPianoKeyboard((midi) => {
  setSelectedPitch(midi, { preview: true });
  log("Selected note from virtual piano", { midi, note: midiToLabel(midi) });
});
setSelectedPitch(pitchInput.value);
void setupMidiInput((note) => setSelectedPitch(note, { preview: true }), log);
void checkBackendStatus();