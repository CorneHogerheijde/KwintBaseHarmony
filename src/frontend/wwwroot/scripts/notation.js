import { notationClefSelect, notationStaff, notationSummary } from "./dom.js";
import { getNoteDescriptor } from "./music.js";
import { getKeyProfile, KEY_SIG_DIATONIC } from "./key-profiles.js";

function getRecentNotationNotes(selectedPitch, composition, rootMidi = 60) {
  const offset = rootMidi - 60;
  const selected = { midi: selectedPitch + offset, isSelected: true };

  if (!composition?.layers) {
    return [selected];
  }

  const recentNotes = composition.layers
    .flatMap((layer) => (layer.notes ?? []).map((note) => ({
      midi: note.pitch + offset,
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

export function renderNotation(selectedPitch, composition, rootMidi = 60) {
  const notes = getRecentNotationNotes(selectedPitch, composition, rootMidi).map((note) => ({
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
  const width = 580;
  const height = 175;

  notationSummary.textContent = notes.length === 1
    ? `Previewing ${notes[0].descriptor.label} on the ${clefReference.label} clef.`
    : `Showing ${notes.length} recent notes on the ${clefReference.label} clef with ${getNoteDescriptor(selectedPitch).label} selected.`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `${clefReference.label} notation preview`);

  const staffStartX = 58;
  const staffEndX = width - 16;

  // Left barline
  const barLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  barLine.setAttribute("x1", String(staffStartX));
  barLine.setAttribute("x2", String(staffStartX));
  barLine.setAttribute("y1", String(topLineY));
  barLine.setAttribute("y2", String(bottomLineY));
  barLine.setAttribute("stroke", "#7c6858");
  barLine.setAttribute("stroke-width", "1.8");
  svg.appendChild(barLine);

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

  // Clef symbol (𝄞 treble / 𝄢 bass)
  const clefText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  clefText.setAttribute("fill", "#2f241d");
  clefText.setAttribute("font-family", "serif");
  if (clef === "bass") {
    clefText.setAttribute("x", "6");
    clefText.setAttribute("y", "92");
    clefText.setAttribute("font-size", "42");
    clefText.textContent = "\u{1D122}"; // 𝄢
  } else {
    clefText.setAttribute("x", "4");
    clefText.setAttribute("y", "128");
    clefText.setAttribute("font-size", "82");
    clefText.textContent = "\u{1D11E}"; // 𝄞
  }
  svg.appendChild(clefText);

  // ── Key signature ────────────────────────────────────────────────────────────
  const keyProfile = getKeyProfile(rootMidi);
  const numAccidentals = keyProfile.accidentals.length;
  const keySigStartX = staffStartX + 8;
  const keySigSymbol = keyProfile.accidentalType === "sharp" ? "\u266f" : "\u266d";
  const diatonicPositions = KEY_SIG_DIATONIC[clef]?.[keyProfile.accidentalType] ?? [];

  for (let i = 0; i < numAccidentals; i++) {
    const diatonicIdx = diatonicPositions[i];
    const symY = bottomLineY - (diatonicIdx - clefReference.bottomLineIndex) * noteSpacing;
    const symX = keySigStartX + i * 11;
    const sym = document.createElementNS("http://www.w3.org/2000/svg", "text");
    sym.setAttribute("x", String(symX));
    sym.setAttribute("y", String(symY + 5));
    sym.setAttribute("fill", "#2f241d");
    sym.setAttribute("font-size", "15");
    sym.setAttribute("font-family", "serif");
    sym.textContent = keySigSymbol;
    svg.appendChild(sym);
  }

  // ── 4/4 time signature (x shifts right when key signature is present) ────────
  const timeSigX = keySigStartX + numAccidentals * 11 + (numAccidentals > 0 ? 5 : 0);

  const timeSigTop = document.createElementNS("http://www.w3.org/2000/svg", "text");
  timeSigTop.setAttribute("x", String(timeSigX + 8));
  timeSigTop.setAttribute("y", String(topLineY + noteSpacing * 2));
  timeSigTop.setAttribute("fill", "#2f241d");
  timeSigTop.setAttribute("font-size", "16");
  timeSigTop.setAttribute("font-family", "serif");
  timeSigTop.setAttribute("text-anchor", "middle");
  timeSigTop.textContent = "4";
  svg.appendChild(timeSigTop);

  const timeSigBottom = document.createElementNS("http://www.w3.org/2000/svg", "text");
  timeSigBottom.setAttribute("x", String(timeSigX + 8));
  timeSigBottom.setAttribute("y", String(topLineY + noteSpacing * 6));
  timeSigBottom.setAttribute("fill", "#2f241d");
  timeSigBottom.setAttribute("font-size", "16");
  timeSigBottom.setAttribute("font-family", "serif");
  timeSigBottom.setAttribute("text-anchor", "middle");
  timeSigBottom.textContent = "4";
  svg.appendChild(timeSigBottom);

  // Spread notes across the staff horizontally (oldest left → newest/selected right)
  const noteAreaStart = timeSigX + 24;
  const noteAreaEnd = staffEndX - 20;
  const noteStep = notes.length > 1 ? (noteAreaEnd - noteAreaStart) / (notes.length - 1) : 0;

  notes.forEach((note, index) => {
    const x = notes.length > 1 ? noteAreaStart + index * noteStep : (noteAreaStart + noteAreaEnd) / 2;
    const y = bottomLineY - (note.descriptor.diatonicIndex - clefReference.bottomLineIndex) * noteSpacing;
    drawLedgerLines(svg, x, y, note.descriptor.diatonicIndex, clefReference, noteSpacing);

    if (note.descriptor.accidental) {
      const accidental = document.createElementNS("http://www.w3.org/2000/svg", "text");
      accidental.setAttribute("x", String(x - 13));
      accidental.setAttribute("y", String(y + 5));
      accidental.setAttribute("fill", "#2f241d");
      accidental.setAttribute("font-size", "18");
      accidental.setAttribute("font-family", "serif");
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
    label.setAttribute("x", String(x));
    label.setAttribute("y", "163");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("fill", note.isSelected ? "#126e5a" : "#6d5b4b");
    label.setAttribute("font-size", "11");
    label.textContent = note.descriptor.label;
    svg.appendChild(label);
  });

  notationStaff.replaceChildren(svg);
}