/**
 * Circle-of-fifths SVG widget.
 *
 * Renders an inline SVG showing all 12 pitch classes arranged in circle-of-fifths
 * order (clockwise from C at 12 o'clock).  The root note (always C in Kwintessence)
 * is outlined in the accent colour; the current layer's target note is filled.  A
 * dashed line connects root to target so the interval relationship is immediately
 * visible.
 */

/** 12 note names in circle-of-fifths order (clockwise, starting at C). */
const NOTES_BY_POS = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F'];

/**
 * Maps MIDI pitch class (0 = C, 1 = C♯, …, 11 = B) to circle position
 * (0 = top = C, clockwise).
 */
const PC_TO_POS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

const SIZE   = 200;
const CX     = SIZE / 2;
const CY     = SIZE / 2;
const R_RING = 72;  // radius of the ring of note nodes
const R_NODE = 17;  // default node circle radius

function posXY(pos) {
  const angle = (pos / 12) * 2 * Math.PI - Math.PI / 2;
  return {
    x: +(CX + R_RING * Math.cos(angle)).toFixed(2),
    y: +(CY + R_RING * Math.sin(angle)).toFixed(2),
  };
}

/**
 * Renders a circle-of-fifths SVG widget into the given container element.
 *
 * @param {Element} container   - The element to render into (its innerHTML is replaced).
 * @param {number}  targetMidi  - MIDI note for the current layer's target (highlighted filled).
 * @param {number}  [rootMidi=60] - Root note MIDI (always C4 in Kwintessence; highlighted outlined).
 */
export function renderCircleOfFifths(container, targetMidi, rootMidi = 60) {
  const targetPc  = targetMidi % 12;
  const rootPc    = rootMidi   % 12;
  const targetPos = PC_TO_POS[targetPc];
  const rootPos   = PC_TO_POS[rootPc];
  const noteName  = NOTES_BY_POS[targetPos];

  const { x: rx, y: ry } = posXY(rootPos);
  const { x: tx, y: ty } = posXY(targetPos);

  // Dashed line from root to target (omitted when they share a position)
  const lineEl = targetPos !== rootPos
    ? `<line x1="${rx}" y1="${ry}" x2="${tx}" y2="${ty}" ` +
      `stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.45"/>`
    : '';

  const nodes = NOTES_BY_POS.map((note, pos) => {
    const { x, y } = posXY(pos);
    const isRoot = pos === rootPos;
    const isTgt  = pos === targetPos;

    let fill = 'var(--bg)';
    let str  = 'var(--border)';
    let tc   = 'var(--muted)';
    let fw   = '400';
    let r    = R_NODE;

    if (isTgt && isRoot) {
      // Same note — root is the target (Layer 1 and Layer 7)
      fill = 'var(--accent)'; str = 'var(--accent)'; tc = '#fff'; fw = '700';
    } else if (isRoot) {
      fill = 'var(--surface-strong)'; str = 'var(--accent)';
      tc   = 'var(--accent)'; fw = '600'; r = R_NODE + 1;
    } else if (isTgt) {
      fill = 'var(--accent)'; str = 'var(--accent)'; tc = '#fff'; fw = '700';
    }

    // Slightly smaller font for two-symbol names (F♯, D♭, etc.)
    const fs = note.length > 2 ? 8.5 : 10;

    return (
      `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${str}" stroke-width="2"/>` +
      `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="${fs}" ` +
      `font-family="inherit" fill="${tc}" font-weight="${fw}">${note}</text>`
    );
  }).join('');

  container.innerHTML =
    `<svg viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg" ` +
    `role="img" aria-label="Circle of fifths — ${noteName} highlighted">` +
    lineEl + nodes +
    `</svg>` +
    `<p class="circle-of-fifths-label">Circle of Fifths · <strong>${noteName}</strong></p>`;
}
