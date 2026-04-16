import { notationClefSelect, notationStaff, notationSummary } from "./dom.js";
import { getNoteDescriptor } from "./music.js";

function getRecentNotationNotes(selectedPitch, composition) {
  const selected = { midi: selectedPitch, isSelected: true };

  if (!composition?.layers) {
    return [selected];
  }

  const recentNotes = composition.layers
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

export function renderNotation(selectedPitch, composition) {
  const notes = getRecentNotationNotes(selectedPitch, composition).map((note) => ({
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
  const width = 300;
  const height = 170;

  notationSummary.textContent = notes.length === 1
    ? `Previewing ${notes[0].descriptor.label} on the ${clefReference.label} clef.`
    : `Showing ${notes.length} recent notes on the ${clefReference.label} clef with ${getNoteDescriptor(selectedPitch).label} selected.`;

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

  // 4/4 time signature
  const timeSigTop = document.createElementNS("http://www.w3.org/2000/svg", "text");
  timeSigTop.setAttribute("x", String(staffStartX + 4));
  timeSigTop.setAttribute("y", String(topLineY + noteSpacing * 2));
  timeSigTop.setAttribute("fill", "#2f241d");
  timeSigTop.setAttribute("font-size", "16");
  timeSigTop.setAttribute("font-family", "serif");
  timeSigTop.setAttribute("text-anchor", "middle");
  timeSigTop.textContent = "4";
  svg.appendChild(timeSigTop);

  const timeSigBottom = document.createElementNS("http://www.w3.org/2000/svg", "text");
  timeSigBottom.setAttribute("x", String(staffStartX + 4));
  timeSigBottom.setAttribute("y", String(topLineY + noteSpacing * 6));
  timeSigBottom.setAttribute("fill", "#2f241d");
  timeSigBottom.setAttribute("font-size", "16");
  timeSigBottom.setAttribute("font-family", "serif");
  timeSigBottom.setAttribute("text-anchor", "middle");
  timeSigBottom.textContent = "4";
  svg.appendChild(timeSigBottom);

  // All notes rendered as a chord at the same x position
  const chordX = 130;

  notes.forEach((note) => {
    const x = chordX;
    const y = bottomLineY - (note.descriptor.diatonicIndex - clefReference.bottomLineIndex) * noteSpacing;
    drawLedgerLines(svg, x, y, note.descriptor.diatonicIndex, clefReference, noteSpacing);

    if (note.descriptor.accidental) {
      const accidental = document.createElementNS("http://www.w3.org/2000/svg", "text");
      accidental.setAttribute("x", String(x - 12));
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
    label.setAttribute("x", String(x - 14));
    label.setAttribute("y", "152");
    label.setAttribute("fill", note.isSelected ? "#126e5a" : "#6d5b4b");
    label.setAttribute("font-size", "11");
    label.textContent = note.descriptor.label;
    svg.appendChild(label);
  });

  notationStaff.replaceChildren(svg);
}