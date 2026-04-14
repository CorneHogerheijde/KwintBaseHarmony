const apiBaseUrl = "http://localhost:5000/api/compositions";

const activityLog = document.getElementById("activity-log");
const statusPill = document.getElementById("api-status");
const summary = document.getElementById("composition-summary");
const layersContainer = document.getElementById("layers");
const createForm = document.getElementById("create-composition-form");
const loadForm = document.getElementById("load-composition-form");
const addNoteForm = document.getElementById("add-note-form");
const refreshStatusButton = document.getElementById("refresh-status");
const exportJsonButton = document.getElementById("download-json");
const exportMidiButton = document.getElementById("download-midi");
const compositionIdInput = document.getElementById("composition-id-input");
const loadJsonIntoEditorButton = document.getElementById("load-json-into-editor");
const importJsonButton = document.getElementById("import-json");
const clearJsonEditorButton = document.getElementById("clear-json-editor");
const jsonEditor = document.getElementById("json-editor");

let currentComposition = null;

function log(message, payload) {
  const line = payload ? `${message}\n${JSON.stringify(payload, null, 2)}` : message;
  activityLog.textContent = `${new Date().toLocaleTimeString()} ${line}\n\n${activityLog.textContent}`.trim();
}

function setStatus(message, isHealthy) {
  statusPill.textContent = message;
  statusPill.style.background = isHealthy ? "rgba(18, 110, 90, 0.1)" : "rgba(187, 94, 48, 0.14)";
  statusPill.style.color = isHealthy ? "#0b4e40" : "#8b3a16";
}

function setCurrentComposition(composition) {
  currentComposition = composition;
  compositionIdInput.value = composition?.id ?? "";
  exportJsonButton.disabled = !composition;
  exportMidiButton.disabled = !composition;
  loadJsonIntoEditorButton.disabled = !composition;

  if (!composition) {
    summary.textContent = "No composition loaded.";
    layersContainer.className = "layer-list empty-state";
    layersContainer.textContent = "Load a composition to inspect its layers.";
    return;
  }

  summary.textContent = `${composition.title} for ${composition.studentId} · ${composition.difficulty} · ${composition.completionPercentage}% complete`;
  renderLayers(composition.layers);
}

function renderLayers(layers) {
  if (!layers || layers.length === 0) {
    layersContainer.className = "layer-list empty-state";
    layersContainer.textContent = "This composition has no layers yet.";
    return;
  }

  layersContainer.className = "layer-list";
  layersContainer.innerHTML = "";

  for (const layer of layers) {
    const card = document.createElement("article");
    card.className = "layer-card";

    const header = document.createElement("header");
    const titleGroup = document.createElement("div");
    const title = document.createElement("h3");
    const concept = document.createElement("p");
    const status = document.createElement("strong");

    title.textContent = `Layer ${layer.layerNumber}: ${layer.name}`;
    concept.className = "layer-meta";
    concept.textContent = layer.concept ?? "No concept description.";
    status.textContent = layer.completed ? "Completed" : "In progress";

    titleGroup.append(title, concept);
    header.append(titleGroup, status);
    card.appendChild(header);

    if (layer.notes.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty-state";
      emptyState.textContent = "No notes recorded.";
      card.appendChild(emptyState);
    } else {
      const noteChipList = document.createElement("div");
      noteChipList.className = "note-chip-list";

      for (const note of layer.notes) {
        const chip = document.createElement("span");
        chip.className = "note-chip";
        chip.textContent = `Pitch ${note.pitch} · ${note.durationMs}ms · t=${note.timingMs}`;
        noteChipList.appendChild(chip);
      }

      card.appendChild(noteChipList);
    }

    layersContainer.appendChild(card);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    ...options
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function checkBackendStatus() {
  try {
    const response = await fetch("http://localhost:5000/health", { method: "GET", mode: "cors" });
    if (!response.ok) {
      throw new Error(`Health check returned ${response.status}`);
    }

    setStatus("Backend reachable on http://localhost:5000", true);
  } catch {
    setStatus("Backend not reachable on http://localhost:5000", false);
  }
}

async function loadCompositionById(id) {
  const composition = await request(`/${id}`);
  setCurrentComposition(composition);
  log("Loaded composition", composition);
}

function getEditorJson() {
  return jsonEditor.value.trim();
}

function setEditorJson(value) {
  jsonEditor.value = value;
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
    setCurrentComposition(composition);
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
    setCurrentComposition(null);
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
    setCurrentComposition(updated);
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

    setCurrentComposition(imported);
    await exportCurrentCompositionJson({ logResult: false });
    log("Imported composition JSON from editor", { compositionId: imported.id });
  } catch (error) {
    log("Failed to import JSON", { error: error.message });
  }
});

void checkBackendStatus();