const apiBaseUrl = "http://localhost:5000/api/compositions";

const activityLog = document.getElementById("activity-log");
const statusPill = document.getElementById("api-status");
const summary = document.getElementById("composition-summary");
const layersContainer = document.getElementById("layers");
const createForm = document.getElementById("create-composition-form");
const loadForm = document.getElementById("load-composition-form");
const addNoteForm = document.getElementById("add-note-form");
const pitchInput = document.getElementById("pitch");
const refreshStatusButton = document.getElementById("refresh-status");
const exportJsonButton = document.getElementById("download-json");
const exportMidiButton = document.getElementById("download-midi");
const compositionIdInput = document.getElementById("composition-id-input");
const loadJsonIntoEditorButton = document.getElementById("load-json-into-editor");
const importJsonButton = document.getElementById("import-json");
const clearJsonEditorButton = document.getElementById("clear-json-editor");
const jsonEditor = document.getElementById("json-editor");
const pianoKeyboard = document.getElementById("piano-keyboard");
const selectedNoteLabel = document.getElementById("selected-note-label");
const previewSelectedNoteButton = document.getElementById("preview-selected-note");
const midiStatus = document.getElementById("midi-status");
const notationStaff = document.getElementById("notation-staff");
const notationClefSelect = document.getElementById("notation-clef");
const notationSummary = document.getElementById("notation-summary");

const pianoRange = { start: 48, end: 72 };
const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const diatonicSteps = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

let currentComposition = null;
let audioContext = null;

function log(message, payload) {
  const line = payload ? `${message}\n${JSON.stringify(payload, null, 2)}` : message;
  activityLog.textContent = `${new Date().toLocaleTimeString()} ${line}\n\n${activityLog.textContent}`.trim();
}

function midiToLabel(midi) {
  const normalized = Math.max(0, Math.min(127, Number(midi) || 0));
  const octave = Math.floor(normalized / 12) - 1;
  return `${noteNames[normalized % 12]}${octave}`;
}

function getNoteDescriptor(midi) {
  const normalized = Math.max(0, Math.min(127, Number(midi) || 0));
  const token = noteNames[normalized % 12];
  const octave = Math.floor(normalized / 12) - 1;
  const letter = token[0];
  const accidental = token.slice(1);

  return {
    midi: normalized,
    token,
    octave,
    letter,
    accidental,
    label: `${token}${octave}`,
    diatonicIndex: octave * 7 + diatonicSteps[letter]
  };
}

function midiToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function setStatus(message, isHealthy) {
  statusPill.textContent = message;
  statusPill.style.background = isHealthy ? "rgba(18, 110, 90, 0.1)" : "rgba(187, 94, 48, 0.14)";
  statusPill.style.color = isHealthy ? "#0b4e40" : "#8b3a16";
}

function getRecentNotationNotes() {
  const selected = { midi: Number(pitchInput.value), isSelected: true };

  if (!currentComposition?.layers) {
    return [selected];
  }

  const recentNotes = currentComposition.layers
    .flatMap((layer) => (layer.notes ?? []).map((note) => ({
      midi: note.pitch,
      timingMs: note.timingMs ?? 0,
      layerNumber: layer.layerNumber,
      isSelected: false
    })))
    .sort((left, right) => left.timingMs - right.timingMs || left.layerNumber - right.layerNumber)
    .slice(-7);

  return [...recentNotes, selected].slice(-8);
}

function drawLedgerLines(svg, x, y, diatonicIndex, clefReference, noteSpacing) {
  const topLineIndex = clefReference.bottomLineIndex + 8;

  if (diatonicIndex < clefReference.bottomLineIndex) {
    for (let lineIndex = clefReference.bottomLineIndex - 2; lineIndex >= diatonicIndex; lineIndex -= 2) {
      const ledgerY = y + (diatonicIndex - lineIndex) * noteSpacing;
      const ledger = document.createElementNS("http://www.w3.org/2000/svg", "line");
      ledger.setAttribute("x1", String(x - 14));
      ledger.setAttribute("x2", String(x + 14));
      ledger.setAttribute("y1", String(ledgerY));
      ledger.setAttribute("y2", String(ledgerY));
      ledger.setAttribute("stroke", "#2f241d");
      ledger.setAttribute("stroke-width", "1.6");
      svg.appendChild(ledger);
    }
  }

  if (diatonicIndex > topLineIndex) {
    for (let lineIndex = topLineIndex + 2; lineIndex <= diatonicIndex; lineIndex += 2) {
      const ledgerY = y - (lineIndex - diatonicIndex) * noteSpacing;
      const ledger = document.createElementNS("http://www.w3.org/2000/svg", "line");
      ledger.setAttribute("x1", String(x - 14));
      ledger.setAttribute("x2", String(x + 14));
      ledger.setAttribute("y1", String(ledgerY));
      ledger.setAttribute("y2", String(ledgerY));
      ledger.setAttribute("stroke", "#2f241d");
      ledger.setAttribute("stroke-width", "1.6");
      svg.appendChild(ledger);
    }
  }
}

function renderNotation() {
  const notes = getRecentNotationNotes().map((note) => ({
    ...note,
    descriptor: getNoteDescriptor(note.midi)
  }));

  const clef = notationClefSelect.value;
  const clefReference = clef === "bass"
    ? { bottomLineIndex: 18, label: "bass" }
    : { bottomLineIndex: 30, label: "treble" };
  const noteSpacing = 10;
  const bottomLineY = 120;
  const topLineY = bottomLineY - noteSpacing * 8;
  const width = Math.max(560, 120 + notes.length * 64);
  const height = 170;

  notationSummary.textContent = notes.length === 1
    ? `Previewing ${notes[0].descriptor.label} on the ${clefReference.label} clef.`
    : `Showing ${notes.length} recent notes on the ${clefReference.label} clef with ${getNoteDescriptor(pitchInput.value).label} selected.`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `${clefReference.label} notation preview`);

  const staffStartX = 76;
  const staffEndX = width - 28;

  for (let line = 0; line < 5; line += 1) {
    const y = topLineY + line * noteSpacing * 2;
    const staffLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    staffLine.setAttribute("x1", String(staffStartX));
    staffLine.setAttribute("x2", String(staffEndX));
    staffLine.setAttribute("y1", String(y));
    staffLine.setAttribute("y2", String(y));
    staffLine.setAttribute("stroke", "#7c6858");
    staffLine.setAttribute("stroke-width", "1.4");
    svg.appendChild(staffLine);
  }

  const clefText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  clefText.setAttribute("x", "16");
  clefText.setAttribute("y", "86");
  clefText.setAttribute("fill", "#2f241d");
  clefText.setAttribute("font-size", "18");
  clefText.setAttribute("font-weight", "700");
  clefText.textContent = clef === "bass" ? "Bass" : "Treble";
  svg.appendChild(clefText);

  notes.forEach((note, index) => {
    const x = 116 + index * 58;
    const y = bottomLineY - (note.descriptor.diatonicIndex - clefReference.bottomLineIndex) * noteSpacing;
    drawLedgerLines(svg, x, y, note.descriptor.diatonicIndex, clefReference, noteSpacing);

    if (note.descriptor.accidental) {
      const accidental = document.createElementNS("http://www.w3.org/2000/svg", "text");
      accidental.setAttribute("x", String(x - 22));
      accidental.setAttribute("y", String(y + 5));
      accidental.setAttribute("fill", "#2f241d");
      accidental.setAttribute("font-size", "22");
      accidental.textContent = note.descriptor.accidental;
      svg.appendChild(accidental);
    }

    const noteHead = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    noteHead.setAttribute("cx", String(x));
    noteHead.setAttribute("cy", String(y));
    noteHead.setAttribute("rx", "10");
    noteHead.setAttribute("ry", "7.5");
    noteHead.setAttribute("fill", note.isSelected ? "#126e5a" : "#2f241d");
    noteHead.setAttribute("transform", `rotate(-18 ${x} ${y})`);
    svg.appendChild(noteHead);

    const stem = document.createElementNS("http://www.w3.org/2000/svg", "line");
    stem.setAttribute("x1", String(x + 8));
    stem.setAttribute("x2", String(x + 8));
    stem.setAttribute("y1", String(y));
    stem.setAttribute("y2", String(y - 36));
    stem.setAttribute("stroke", note.isSelected ? "#126e5a" : "#2f241d");
    stem.setAttribute("stroke-width", "1.8");
    svg.appendChild(stem);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(x - 14));
    label.setAttribute("y", "152");
    label.setAttribute("fill", note.isSelected ? "#126e5a" : "#6d5b4b");
    label.setAttribute("font-size", "11");
    label.textContent = note.descriptor.label;
    svg.appendChild(label);
  });

  notationStaff.replaceChildren(svg);
}

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

function playPreviewNote(midi) {
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

function syncSelectedPitchDisplay(midi) {
  const normalized = Math.max(0, Math.min(127, Number(midi) || 0));
  selectedNoteLabel.textContent = `${midiToLabel(normalized)} · MIDI ${normalized}`;

  for (const key of pianoKeyboard.querySelectorAll(".piano-key")) {
    key.classList.toggle("is-active", Number(key.dataset.midi) === normalized);
  }
}

function setSelectedPitch(midi, { preview = false } = {}) {
  const normalized = Math.max(0, Math.min(127, Number(midi) || 0));
  pitchInput.value = normalized;
  syncSelectedPitchDisplay(normalized);
  renderNotation();

  if (preview) {
    playPreviewNote(normalized);
  }
}

function renderPianoKeyboard() {
  const fragment = document.createDocumentFragment();

  for (let midi = pianoRange.start; midi <= pianoRange.end; midi += 1) {
    const key = document.createElement("button");
    const noteName = noteNames[midi % 12];
    const isBlackKey = noteName.includes("#");

    key.type = "button";
    key.className = `piano-key ${isBlackKey ? "black-key" : "white-key"}`;
    key.dataset.midi = String(midi);
    key.setAttribute("aria-label", `${midiToLabel(midi)} piano key`);
    key.innerHTML = `<span class="note-name">${midiToLabel(midi)}</span><span class="midi-label">${midi}</span>`;
    key.addEventListener("click", () => {
      setSelectedPitch(midi, { preview: true });
      log("Selected note from virtual piano", { midi, note: midiToLabel(midi) });
    });

    fragment.appendChild(key);
  }

  pianoKeyboard.replaceChildren(fragment);
  syncSelectedPitchDisplay(pitchInput.value);
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
  renderNotation();
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
        chip.textContent = `${midiToLabel(note.pitch)} · ${note.durationMs}ms · t=${note.timingMs}`;
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

previewSelectedNoteButton.addEventListener("click", () => {
  const midi = Number(pitchInput.value);
  playPreviewNote(midi);
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
  renderNotation();
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

async function setupMidiInput() {
  if (!("requestMIDIAccess" in navigator)) {
    midiStatus.textContent = "Web MIDI unavailable in this browser";
    return;
  }

  try {
    const midiAccess = await navigator.requestMIDIAccess();

    const bindInputs = () => {
      const inputs = Array.from(midiAccess.inputs.values());
      midiStatus.textContent = inputs.length === 0
        ? "MIDI ready, connect a keyboard to play notes"
        : `MIDI input ready: ${inputs[0].name}${inputs.length > 1 ? ` +${inputs.length - 1} more` : ""}`;

      for (const input of inputs) {
        input.onmidimessage = (event) => {
          const [status, note, velocity] = event.data;
          const command = status & 0xf0;

          if (command === 0x90 && velocity > 0) {
            setSelectedPitch(note, { preview: true });
            log("Received MIDI note input", {
              midi: note,
              note: midiToLabel(note),
              device: input.name ?? "MIDI device"
            });
          }
        };
      }
    };

    bindInputs();
    midiAccess.onstatechange = bindInputs;
  } catch (error) {
    midiStatus.textContent = "MIDI permission denied or unavailable";
    log("Failed to initialize MIDI input", { error: error.message });
  }
}

renderPianoKeyboard();
setSelectedPitch(pitchInput.value);
void setupMidiInput();
void checkBackendStatus();