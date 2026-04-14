import {
  compositionIdInput,
  exportJsonButton,
  exportMidiButton,
  jsonEditor,
  layersContainer,
  loadJsonIntoEditorButton,
  summary
} from "./dom.js";
import { midiToLabel } from "./music.js";

export function renderLayers(layers) {
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

export function setEditorJson(value) {
  jsonEditor.value = value;
}

export function getEditorJson() {
  return jsonEditor.value.trim();
}

export function setCurrentComposition(composition, renderNotation) {
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