/**
 * notation.js — Grand-staff SVG notation renderer.
 *
 * Always renders a treble + bass grand staff. Notes are auto-assigned:
 *   - MIDI ≥ 60 (C4 and above) → treble staff
 *   - MIDI < 60                 → bass staff
 *   - Middle C (MIDI 60) gets a ledger line between the two staves.
 *
 * Notes sharing the same timingMs are rendered as a chord (same x column).
 *
 * Public API
 * ----------
 * renderNotation(selectedPitch, composition, rootMidi?)
 *   selectedPitch – MIDI number of the currently selected / highlighted note
 *   composition   – Composition object (may be null/undefined)
 *   rootMidi      – Key root in MIDI (default 60 = C major)
 */

import { notationStaff, notationSummary } from "./dom.js";
import { getNoteDescriptorForKey } from "./music.js";
import { getKeyProfile, KEY_SIG_DIATONIC } from "./key-profiles.js";

// Pitch-class values for every possible key-signature accidental token.
const ACCIDENTAL_PC = {
  "F♯": 6, "C♯": 1, "G♯": 8, "D♯": 3, "A♯": 10, "E♯": 5, "B♯": 11,
  "B♭": 10, "E♭": 3, "A♭": 8, "D♭": 1, "G♭": 6, "C♭": 11, "F♭": 4
};


// ── Grand-staff layout constants ────────────────────────────────────────────

/** Pixels per diatonic half-step (staff line spacing ÷ 2). */
const NOTE_SPACING = 8;

/** Diatonic index of the bottom line of each staff. */
const TREBLE_BOTTOM_LINE_D = 30; // E4
const BASS_BOTTOM_LINE_D   = 18; // G2

/** Y coordinate of the bottom staff line (treble). */
const TREBLE_BOTTOM_Y = 78;

/**
 * Vertical gap between treble bottom line and bass top line.
 * 32 px = 4 diatonic half-steps, which makes the note-spacing continuous across
 * both staves and centres the middle-C ledger line exactly halfway between them.
 */
const STAFF_GAP = 32;

const BASS_TOP_Y    = TREBLE_BOTTOM_Y + STAFF_GAP;            // 104
const BASS_BOTTOM_Y = BASS_TOP_Y + 4 * 2 * NOTE_SPACING;     // 168

/** Note label area below bass staff. */
const LABEL_AREA_H = 22;

const CANVAS_WIDTH  = 580;
const CANVAS_HEIGHT = BASS_BOTTOM_Y + LABEL_AREA_H + 4;       // ≈ 194

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Y pixel position of a note given its diatonic index and which staff it lives on. */
function noteY(diatonicIndex, onTreble) {
  return onTreble
    ? TREBLE_BOTTOM_Y - (diatonicIndex - TREBLE_BOTTOM_LINE_D) * NOTE_SPACING
    : BASS_BOTTOM_Y   - (diatonicIndex - BASS_BOTTOM_LINE_D)   * NOTE_SPACING;
}

/** True when the note belongs on the treble staff (MIDI ≥ 60). */
function isTreble(midi) {
  return midi >= 60;
}

// ── SVG element builders ────────────────────────────────────────────────────

function svgEl(tag) {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

function svgLine(x1, y1, x2, y2, stroke, strokeWidth) {
  const el = svgEl("line");
  el.setAttribute("x1", String(x1));
  el.setAttribute("y1", String(y1));
  el.setAttribute("x2", String(x2));
  el.setAttribute("y2", String(y2));
  el.setAttribute("stroke", stroke);
  el.setAttribute("stroke-width", String(strokeWidth));
  return el;
}

function svgText(x, y, content, fontSize, fill, anchor = null) {
  const el = svgEl("text");
  el.setAttribute("x", String(x));
  el.setAttribute("y", String(y));
  el.setAttribute("fill", fill);
  el.setAttribute("font-size", String(fontSize));
  el.setAttribute("font-family", "serif");
  if (anchor) el.setAttribute("text-anchor", anchor);
  el.textContent = content;
  return el;
}

// ── Ledger line drawing ──────────────────────────────────────────────────────

/**
 * Draws ledger lines above/below a staff for notes outside the 5-line range.
 * Middle C (diatonic 28 = C4) always receives its ledger line between the two staves.
 */
function drawLedgerLines(svg, x, diatonicIndex, onTreble) {
  const bottomD = onTreble ? TREBLE_BOTTOM_LINE_D : BASS_BOTTOM_LINE_D;
  const topD    = bottomD + 8;

  // Middle C ledger between staves
  if (diatonicIndex === 28) {
    const midCY = noteY(28, onTreble);
    svg.appendChild(svgLine(x - 14, midCY, x + 14, midCY, "#2f241d", 1.6));
    return;
  }

  // Below-bottom ledgers
  if (diatonicIndex < bottomD) {
    for (let d = bottomD - 2; d >= diatonicIndex; d -= 2) {
      const ly = noteY(d, onTreble);
      svg.appendChild(svgLine(x - 14, ly, x + 14, ly, "#2f241d", 1.6));
    }
  }

  // Above-top ledgers
  if (diatonicIndex > topD) {
    for (let d = topD + 2; d <= diatonicIndex; d += 2) {
      const ly = noteY(d, onTreble);
      svg.appendChild(svgLine(x - 14, ly, x + 14, ly, "#2f241d", 1.6));
    }
  }
}

// ── Staff drawing ────────────────────────────────────────────────────────────

function drawStaff(svg, bottomY, staffStartX, staffEndX) {
  const topY = bottomY - 4 * 2 * NOTE_SPACING;
  for (let i = 0; i < 5; i++) {
    const y = topY + i * 2 * NOTE_SPACING;
    svg.appendChild(svgLine(staffStartX, y, staffEndX, y, "#7c6858", 1.4));
  }
}

// ── Clef glyphs ──────────────────────────────────────────────────────────────

function drawTrebleClef(svg) {
  svg.appendChild(svgText(4, TREBLE_BOTTOM_Y + 14, "\u{1D11E}", 72, "#2f241d")); // 𝄞
}

function drawBassClef(svg) {
  svg.appendChild(svgText(6, BASS_TOP_Y + 18, "\u{1D122}", 38, "#2f241d")); // 𝄢
}

// ── Key signature ────────────────────────────────────────────────────────────

/**
 * Draws key signature accidentals on both treble and bass staves.
 * Returns the X position after the last symbol (where the time sig starts).
 */
function drawKeySignature(svg, keySigStartX, keyProfile) {
  const { accidentals, accidentalType } = keyProfile;
  const n = accidentals.length;
  if (n === 0) return keySigStartX;

  const sym = accidentalType === "sharp" ? "\u266f" : "\u266d";

  for (const clef of ["treble", "bass"]) {
    const positions = KEY_SIG_DIATONIC[clef]?.[accidentalType] ?? [];
    const bottomD   = clef === "treble" ? TREBLE_BOTTOM_LINE_D : BASS_BOTTOM_LINE_D;
    const bottomY   = clef === "treble" ? TREBLE_BOTTOM_Y      : BASS_BOTTOM_Y;

    for (let i = 0; i < n; i++) {
      const dIdx = positions[i];
      const symY = bottomY - (dIdx - bottomD) * NOTE_SPACING;
      const symX = keySigStartX + i * 10;
      svg.appendChild(svgText(symX, symY + 5, sym, 14, "#2f241d"));
    }
  }

  return keySigStartX + n * 10 + (n > 0 ? 4 : 0);
}

// ── Time signature ───────────────────────────────────────────────────────────

function drawTimeSignature(svg, x) {
  const trebleTopY = TREBLE_BOTTOM_Y - 4 * 2 * NOTE_SPACING;
  const bassTopY   = BASS_TOP_Y;

  for (const topY of [trebleTopY, bassTopY]) {
    svg.appendChild(svgText(x + 8, topY + NOTE_SPACING * 2, "4", 15, "#2f241d", "middle"));
    svg.appendChild(svgText(x + 8, topY + NOTE_SPACING * 6, "4", 15, "#2f241d", "middle"));
  }

  return x + 20;
}

// ── Note collection ──────────────────────────────────────────────────────────

/**
 * Returns an array of "beat" arrays: each inner array holds notes that share
 * the same timingMs and should be rendered as a chord column.
 */
function getRecentNotationNotes(selectedPitch, composition, rootMidi) {
  const offset   = rootMidi - 60;
  const selected = { midi: selectedPitch + offset, timingMs: Infinity, isSelected: true };

  if (!composition?.layers) {
    return [[selected]];
  }

  const allNotes = composition.layers
    .flatMap((layer) => (layer.notes ?? []).map((note) => ({
      midi:        note.pitch + offset,
      timingMs:    note.timingMs ?? 0,
      layerNumber: layer.layerNumber,
      isSelected:  false
    })))
    .sort((a, b) => a.timingMs - b.timingMs || a.layerNumber - b.layerNumber);

  const recent = allNotes.slice(-7);
  const flat   = [...recent, selected].slice(-8);

  // Group into chord columns by timingMs
  const beatMap = new Map();
  for (const note of flat) {
    const key = note.timingMs;
    if (!beatMap.has(key)) beatMap.set(key, []);
    beatMap.get(key).push(note);
  }

  return [...beatMap.values()];
}

// ── Note rendering ───────────────────────────────────────────────────────────

function drawNoteHead(svg, x, y, isSelected) {
  const fill = isSelected ? "#126e5a" : "#2f241d";
  const el   = svgEl("ellipse");
  el.setAttribute("cx", String(x));
  el.setAttribute("cy", String(y));
  el.setAttribute("rx", "9");
  el.setAttribute("ry", "6.5");
  el.setAttribute("fill", fill);
  el.setAttribute("transform", `rotate(-18 ${x} ${y})`);
  svg.appendChild(el);
}

function drawStem(svg, x, y, isSelected) {
  const color = isSelected ? "#126e5a" : "#2f241d";
  svg.appendChild(svgLine(x + 7, y, x + 7, y - 32, color, 1.6));
}

/** Renders a single beat (one or more simultaneous notes) at position x. */
function renderBeat(svg, beat, x, keyProfile, keySigPcs) {
  for (const note of beat) {
    const desc     = getNoteDescriptorForKey(note.midi, keyProfile);
    const onTreble = isTreble(note.midi);
    const y        = noteY(desc.diatonicIndex, onTreble);

    drawLedgerLines(svg, x, desc.diatonicIndex, onTreble);

    // Only draw an accidental when it is NOT already implied by the key signature.
    if (desc.accidental && !keySigPcs.has(note.midi % 12)) {
      const fill = note.isSelected ? "#126e5a" : "#2f241d";
      svg.appendChild(svgText(x - 12, y + 4, desc.accidental, 16, fill));
    }

    drawNoteHead(svg, x, y, note.isSelected);
    drawStem(svg, x, y, note.isSelected);
  }

  // Label: prefer the selected note, fall back to last note in beat
  const labelNote = beat.find((n) => n.isSelected) ?? beat[beat.length - 1];
  const labelDesc = getNoteDescriptorForKey(labelNote.midi, keyProfile);
  const labelEl   = svgText(x, BASS_BOTTOM_Y + LABEL_AREA_H - 4, labelDesc.label, 10,
    labelNote.isSelected ? "#126e5a" : "#6d5b4b", "middle");
  svg.appendChild(labelEl);
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * Renders a grand-staff (treble + bass) SVG notation preview into #notation-staff.
 *
 * @param {number}      selectedPitch  MIDI number of the active note
 * @param {object|null} composition    Current composition (may be null)
 * @param {number}      [rootMidi=60]  Key root MIDI (default = C major)
 */
export function renderNotation(selectedPitch, composition, rootMidi = 60) {
  const beats      = getRecentNotationNotes(selectedPitch, composition, rootMidi);
  const keyProfile = getKeyProfile(rootMidi);
  // Set of pitch classes already covered by the key signature (no need to redraw).
  const keySigPcs  = new Set(keyProfile.accidentals.map((a) => ACCIDENTAL_PC[a] ?? -1));

  const totalNotes = beats.reduce((acc, b) => acc + b.length, 0);
  const selNote    = beats.flatMap((b) => b).find((n) => n.isSelected);
  const selLabel   = selNote
    ? getNoteDescriptorForKey(selNote.midi, keyProfile).label
    : getNoteDescriptorForKey(selectedPitch, keyProfile).label;

  notationSummary.textContent = totalNotes === 1
    ? `Previewing ${selLabel} on the grand staff.`
    : `Showing ${totalNotes} recent notes on the grand staff with ${selLabel} selected.`;

  const staffStartX = 56;
  const staffEndX   = CANVAS_WIDTH - 16;

  const svg = svgEl("svg");
  svg.setAttribute("viewBox", `0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Grand staff notation preview");

  // Staves
  drawStaff(svg, TREBLE_BOTTOM_Y, staffStartX, staffEndX);
  drawStaff(svg, BASS_BOTTOM_Y,   staffStartX, staffEndX);

  // Grand barline spanning both staves
  const trebleTopY = TREBLE_BOTTOM_Y - 4 * 2 * NOTE_SPACING;
  svg.appendChild(svgLine(staffStartX, trebleTopY, staffStartX, BASS_BOTTOM_Y, "#7c6858", 1.8));

  // Clef symbols
  drawTrebleClef(svg);
  drawBassClef(svg);

  // Key signature (on both staves)
  const keySigStartX  = staffStartX + 8;
  let   noteAreaStart = drawKeySignature(svg, keySigStartX, keyProfile);

  // Time signature (on both staves)
  noteAreaStart = drawTimeSignature(svg, noteAreaStart) + 8;

  // Notes / chord columns
  const noteAreaEnd = staffEndX - 20;
  const beatCount   = beats.length;
  const beatStep    = beatCount > 1 ? (noteAreaEnd - noteAreaStart) / (beatCount - 1) : 0;

  beats.forEach((beat, i) => {
    const x = beatCount > 1
      ? noteAreaStart + i * beatStep
      : (noteAreaStart + noteAreaEnd) / 2;
    renderBeat(svg, beat, x, keyProfile, keySigPcs);
  });

  notationStaff.replaceChildren(svg);
}

