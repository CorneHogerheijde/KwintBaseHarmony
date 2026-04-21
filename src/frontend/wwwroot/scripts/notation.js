import { notationStaff, notationSummary } from "./dom.js";
import { getNoteDescriptor } from "./music.js";
import { getKeyProfile, KEY_SIG_DIATONIC } from "./key-profiles.js";

// ── Grand staff geometry ──────────────────────────────────────────────────────
//
// All Y coordinates are computed from a single unified formula:
//   y(diatonicIndex) = TREBLE_BOTTOM_Y - (diatonicIndex - TREBLE_BOTTOM_IDX) * NOTE_SPACING
//
// Diatonic index reference (octave * 7 + diatonicStep):
//   Treble staff lines: E4=30, G4=32, B4=34, D5=36, F5=38
//   Bass   staff lines: G2=18, B2=20, D3=22, F3=24, A3=26
//   Middle C = C4 = diatonicIndex 28 (sits between the two staves)

const NOTE_SPACING      = 10;  // px per diatonic half-step
const TREBLE_BOTTOM_Y   = 100; // Y for E4 (bottom line of treble staff)
const TREBLE_BOTTOM_IDX = 30;  // diatonicIndex of treble bottom line
const TREBLE_TOP_IDX    = 38;  // diatonicIndex of treble top line  (F5)
const BASS_BOTTOM_IDX   = 18;  // diatonicIndex of bass   bottom line (G2)
const BASS_TOP_IDX      = 26;  // diatonicIndex of bass   top line   (A3)
const MIDDLE_C_IDX      = 28;  // diatonicIndex of C4 (between staves)
const STAFF_START_X     = 58;  // x where both staves begin
const SVG_WIDTH         = 580;
const SVG_HEIGHT        = 260;

/** Convert a diatonic index to an absolute Y pixel position on the grand staff. */
export function diatonicY(diatonicIndex) {
  return TREBLE_BOTTOM_Y - (diatonicIndex - TREBLE_BOTTOM_IDX) * NOTE_SPACING;
}

// ── SVG helpers ───────────────────────────────────────────────────────────────

function mkLine(x1, y1, x2, y2, stroke, strokeWidth) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "line");
  el.setAttribute("x1", String(x1));
  el.setAttribute("y1", String(y1));
  el.setAttribute("x2", String(x2));
  el.setAttribute("y2", String(y2));
  el.setAttribute("stroke", stroke);
  el.setAttribute("stroke-width", String(strokeWidth));
  return el;
}

function mkText(x, y, text, fill, fontSize, anchor = "middle") {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "text");
  el.setAttribute("x", String(x));
  el.setAttribute("y", String(y));
  el.setAttribute("fill", fill);
  el.setAttribute("font-size", String(fontSize));
  el.setAttribute("font-family", "serif");
  el.setAttribute("text-anchor", anchor);
  el.textContent = text;
  return el;
}

// ── Staff drawing ─────────────────────────────────────────────────────────────

function drawStaff(svg, bottomIdx, staffEndX) {
  for (let i = 0; i < 5; i++) {
    const d = bottomIdx + i * 2;
    const y = diatonicY(d);
    svg.appendChild(mkLine(STAFF_START_X, y, staffEndX, y, "#7c6858", 1.4));
  }
}

// ── Ledger lines ──────────────────────────────────────────────────────────────

/**
 * Draw ledger lines for a note that lies outside the given staff's line range.
 * Uses the unified diatonicY coordinate system.
 */
export function drawLedgerLines(svg, x, diatonicIndex, bottomIdx, topIdx) {
  if (diatonicIndex < bottomIdx) {
    for (let d = bottomIdx - 2; d >= diatonicIndex; d -= 2) {
      svg.appendChild(mkLine(x - 14, diatonicY(d), x + 14, diatonicY(d), "#2f241d", 1.6));
    }
  }
  if (diatonicIndex > topIdx) {
    for (let d = topIdx + 2; d <= diatonicIndex; d += 2) {
      svg.appendChild(mkLine(x - 14, diatonicY(d), x + 14, diatonicY(d), "#2f241d", 1.6));
    }
  }
}

// ── Key signature helper ──────────────────────────────────────────────────────

function drawKeySignature(svg, keyProfile, clef, startX) {
  if (keyProfile.accidentalType === "none") return startX;

  const symbol    = keyProfile.accidentalType === "sharp" ? "\u266f" : "\u266d";
  const positions = KEY_SIG_DIATONIC[clef]?.[keyProfile.accidentalType] ?? [];
  const count     = keyProfile.accidentals.length;

  for (let i = 0; i < count; i++) {
    const sy = diatonicY(positions[i]) + 5;
    const sx = startX + i * 11;
    svg.appendChild(mkText(sx, sy, symbol, "#2f241d", 15, "start"));
  }

  return startX + count * 11 + (count > 0 ? 5 : 0);
}

// ── Note data ─────────────────────────────────────────────────────────────────

function getRecentNotationNotes(selectedPitch, composition, rootMidi = 60) {
  const offset   = rootMidi - 60;
  const selected = { midi: selectedPitch + offset, isSelected: true };

  if (!composition?.layers) return [selected];

  const recentNotes = composition.layers
    .flatMap((layer) =>
      (layer.notes ?? []).map((note) => ({
        midi: note.pitch + offset,
        timingMs: note.timingMs ?? 0,
        layerNumber: layer.layerNumber,
        isSelected: false
      }))
    )
    .sort((a, b) => a.timingMs - b.timingMs || a.layerNumber - b.layerNumber)
    .slice(-7);

  return [...recentNotes, selected].slice(-8);
}

// ── Main render ───────────────────────────────────────────────────────────────

export function renderNotation(selectedPitch, composition, rootMidi = 60) {
  const notes = getRecentNotationNotes(selectedPitch, composition, rootMidi).map((note) => ({
    ...note,
    descriptor: getNoteDescriptor(note.midi)
  }));

  const selectedDesc = notes.find((n) => n.isSelected)?.descriptor ?? getNoteDescriptor(selectedPitch);

  notationSummary.textContent =
    notes.length === 1
      ? `Previewing ${selectedDesc.label} on the grand staff.`
      : `Showing ${notes.length} recent notes on the grand staff with ${selectedDesc.label} selected.`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Grand staff notation preview");

  const staffEndX = SVG_WIDTH - 16;

  // ── Connecting barline (spans both staves) ─────────────────────────────────
  svg.appendChild(mkLine(STAFF_START_X, diatonicY(TREBLE_TOP_IDX), STAFF_START_X, diatonicY(BASS_BOTTOM_IDX), "#7c6858", 1.8));

  // ── Draw both staves ───────────────────────────────────────────────────────
  drawStaff(svg, TREBLE_BOTTOM_IDX, staffEndX);
  drawStaff(svg, BASS_BOTTOM_IDX, staffEndX);

  // ── Clef symbols ───────────────────────────────────────────────────────────
  // Treble clef (𝄞): baseline just below treble bottom line
  svg.appendChild(mkText(4, TREBLE_BOTTOM_Y + 8, "\u{1D11E}", "#2f241d", 82, "start"));

  // Bass clef (𝄢): baseline ~28 px above bass bottom line
  svg.appendChild(mkText(6, diatonicY(BASS_BOTTOM_IDX) - 28, "\u{1D122}", "#2f241d", 42, "start"));

  // ── Key signatures on both staves ─────────────────────────────────────────
  const keyProfile   = getKeyProfile(rootMidi);
  const keySigStartX = STAFF_START_X + 8;
  const afterKeySig  = drawKeySignature(svg, keyProfile, "treble", keySigStartX);
  drawKeySignature(svg, keyProfile, "bass", keySigStartX);

  // ── 4/4 time signature on both staves ─────────────────────────────────────
  const timeSigX = afterKeySig;

  // Treble time sig
  svg.appendChild(mkText(timeSigX + 8, diatonicY(TREBLE_TOP_IDX) + NOTE_SPACING * 2, "4", "#2f241d", 16));
  svg.appendChild(mkText(timeSigX + 8, diatonicY(TREBLE_TOP_IDX) + NOTE_SPACING * 6, "4", "#2f241d", 16));

  // Bass time sig
  svg.appendChild(mkText(timeSigX + 8, diatonicY(BASS_TOP_IDX) + NOTE_SPACING * 2, "4", "#2f241d", 16));
  svg.appendChild(mkText(timeSigX + 8, diatonicY(BASS_TOP_IDX) + NOTE_SPACING * 6, "4", "#2f241d", 16));

  // ── Notes ─────────────────────────────────────────────────────────────────
  const noteAreaStart = timeSigX + 24;
  const noteAreaEnd   = staffEndX - 20;
  const noteStep      = notes.length > 1 ? (noteAreaEnd - noteAreaStart) / (notes.length - 1) : 0;

  notes.forEach((note, index) => {
    const x = notes.length > 1 ? noteAreaStart + index * noteStep : (noteAreaStart + noteAreaEnd) / 2;
    const d = note.descriptor.diatonicIndex;
    const y = diatonicY(d);

    // Route note to the correct staff for ledger line drawing
    if (d >= MIDDLE_C_IDX) {
      drawLedgerLines(svg, x, d, TREBLE_BOTTOM_IDX, TREBLE_TOP_IDX);
    } else {
      drawLedgerLines(svg, x, d, BASS_BOTTOM_IDX, BASS_TOP_IDX);
    }

    // Accidental
    if (note.descriptor.accidental) {
      svg.appendChild(mkText(x - 13, y + 5, note.descriptor.accidental, "#2f241d", 18, "middle"));
    }

    // Note head
    const noteHead = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    noteHead.setAttribute("cx",        String(x));
    noteHead.setAttribute("cy",        String(y));
    noteHead.setAttribute("rx",        "10");
    noteHead.setAttribute("ry",        "7.5");
    noteHead.setAttribute("fill",      note.isSelected ? "#126e5a" : "#2f241d");
    noteHead.setAttribute("transform", `rotate(-18 ${x} ${y})`);
    svg.appendChild(noteHead);

    // Stem (upward)
    svg.appendChild(mkLine(x + 8, y, x + 8, y - 36, note.isSelected ? "#126e5a" : "#2f241d", 1.8));

    // Octave-qualified label below bass bottom
    const labelY = diatonicY(BASS_BOTTOM_IDX) + 30;
    svg.appendChild(mkText(x, labelY, note.descriptor.label, note.isSelected ? "#126e5a" : "#6d5b4b", 11));
  });

  notationStaff.replaceChildren(svg);
}