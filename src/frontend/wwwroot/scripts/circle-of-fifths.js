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

/** Relative minors in circle-of-fifths order (same angular position as major). */
const MINORS_BY_POS = ['Am', 'Em', 'Bm', 'F♯m', 'C♯m', 'G♯m', 'E♭m', 'B♭m', 'Fm', 'Cm', 'Gm', 'Dm'];

/**
 * Maps MIDI pitch class (0 = C, 1 = C♯, …, 11 = B) to circle position
 * (0 = top = C, clockwise).
 */
const PC_TO_POS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

const SIZE   = 200;
const CX     = SIZE / 2;
const CY     = SIZE / 2;
const R_RING  = 72;  // radius of the outer ring of note nodes
const R_INNER = 46;  // radius of the inner ring of relative minors
const R_NODE  = 17;  // default node circle radius
const R_MINOR = 11;  // minor ring node radius

function posXY(pos, radius = R_RING) {
  const angle = (pos / 12) * 2 * Math.PI - Math.PI / 2;
  return {
    x: +(CX + radius * Math.cos(angle)).toFixed(2),
    y: +(CY + radius * Math.sin(angle)).toFixed(2),
  };
}

/**
 * Renders a circle-of-fifths SVG widget into the given container element.
 *
 * @param {Element} container   - The element to render into (its innerHTML is replaced).
 * @param {number}  targetMidi  - MIDI note for the current layer's target (highlighted filled).
 * @param {number}  [rootMidi=60] - Root note MIDI (always C4 in Kwintessence; highlighted outlined).
 * @param {number[]} [completedMidis=[]] - MIDI notes that are completed (shown in light green).
 */
export function renderCircleOfFifths(container, targetMidi, rootMidi = 60, completedMidis = []) {
  const targetPc  = targetMidi % 12;
  const rootPc    = rootMidi   % 12;
  const targetPos = PC_TO_POS[targetPc];
  const rootPos   = PC_TO_POS[rootPc];
  const noteName  = NOTES_BY_POS[targetPos];

  const completedPcs = new Set(completedMidis.map((m) => m % 12));

  const { x: rx, y: ry } = posXY(rootPos);
  const { x: tx, y: ty } = posXY(targetPos);

  // Dashed line from root to target (omitted when they share a position)
  const lineEl = targetPos !== rootPos
    ? `<line x1="${rx}" y1="${ry}" x2="${tx}" y2="${ty}" ` +
      `stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.45"/>`
    : '';

  const outerNodes = NOTES_BY_POS.map((note, pos) => {
    const { x, y } = posXY(pos);
    const isRoot = pos === rootPos;
    const isTgt  = pos === targetPos;
    const pc     = Object.entries(PC_TO_POS).find(([, p]) => p === pos)?.[0];
    const isCompleted = pc !== undefined && completedPcs.has(Number(pc));

    let fill = 'var(--bg)';
    let str  = 'var(--border)';
    let tc   = 'var(--muted)';
    let fw   = '400';
    let r    = R_NODE;
    let extraClass = '';

    if (isTgt && isRoot) {
      fill = 'var(--accent)'; str = 'var(--accent)'; tc = '#fff'; fw = '700';
      extraClass = 'cof-target-pulse';
    } else if (isRoot) {
      fill = 'var(--surface-strong)'; str = 'var(--accent)';
      tc   = 'var(--accent)'; fw = '600'; r = R_NODE + 1;
    } else if (isTgt) {
      fill = 'var(--accent)'; str = 'var(--accent)'; tc = '#fff'; fw = '700';
      extraClass = 'cof-target-pulse';
    } else if (isCompleted) {
      str = '#6fcf97'; fill = 'var(--bg)';
    }

    // Slightly smaller font for two-symbol names (F♯, D♭, etc.)
    const fs = note.length > 2 ? 8.5 : 10;

    return (
      `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${str}" stroke-width="2"${extraClass ? ` class="${extraClass}"` : ''}/>` +
      `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="${fs}" ` +
      `font-family="inherit" fill="${tc}" font-weight="${fw}">${note}</text>`
    );
  }).join('');

  const innerNodes = MINORS_BY_POS.map((minor, pos) => {
    const { x, y } = posXY(pos, R_INNER);
    const fs = minor.length > 3 ? 6.5 : 8;
    return (
      `<circle cx="${x}" cy="${y}" r="${R_MINOR}" fill="var(--bg)" stroke="var(--border)" stroke-width="1.5"/>` +
      `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="${fs}" ` +
      `font-family="inherit" fill="var(--muted)">${minor}</text>`
    );
  }).join('');

  container.innerHTML =
    `<svg viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg" ` +
    `role="img" aria-label="Circle of fifths — ${noteName} highlighted">` +
    lineEl + innerNodes + outerNodes +
    `</svg>` +
    `<p class="circle-of-fifths-label">Circle of Fifths · <strong>${noteName}</strong></p>`;
}
