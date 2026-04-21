import { backendBaseUrl } from "./scripts/dom.js";
import { getToken } from "./scripts/auth.js";
import { renderAuthNav } from "./scripts/nav-auth.js";

async function apiRequest(path, options = {}) {
  const token = getToken();
  const authHeader = token ? { "Authorization": `Bearer ${token}` } : {};
  const response = await fetch(`${backendBaseUrl}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeader, ...(options.headers ?? {}) },
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  return response.json();
}

renderAuthNav("auth-nav");

// ── DOM refs ──────────────────────────────────────────────────────────────────

const form           = document.getElementById("analysis-form");
const studentIdInput = document.getElementById("student-id-input");
const titleInput     = document.getElementById("title-input");
const chartInput     = document.getElementById("chord-chart-input");
const analyseBtn     = document.getElementById("analyse-btn");
const errorEl        = document.getElementById("analysis-error");
const resultsPanel   = document.getElementById("analysis-results");
const chordListEl    = document.getElementById("chord-list");
const explanationEl  = document.getElementById("analysis-explanation");
const openLink       = document.getElementById("open-composition-link");

// ── Helpers ───────────────────────────────────────────────────────────────────

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function clearError() {
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

function setLoading(loading) {
  analyseBtn.disabled = loading;
  analyseBtn.dataset.original = analyseBtn.dataset.original ?? analyseBtn.textContent;
  analyseBtn.textContent = loading ? "Analysing…" : analyseBtn.dataset.original;
}

// ── Chord badge rendering ─────────────────────────────────────────────────────

const QUALITY_LABEL = {
  major:      "major",
  minor:      "minor",
  dominant7:  "dom 7",
  major7:     "maj 7",
  minor7:     "min 7",
  diminished: "dim",
  augmented:  "aug",
};

function renderChordBadge(chord) {
  const badge = document.createElement("div");
  badge.className = `chord-badge ${chord.isMinor ? "chord-badge--minor" : "chord-badge--major"}`;
  badge.setAttribute("aria-label", `${chord.symbol} — ${chord.quality}`);

  const symbol = document.createElement("span");
  symbol.className = "chord-badge__symbol";
  symbol.textContent = chord.symbol;

  const quality = document.createElement("span");
  quality.className = "chord-badge__quality";
  quality.textContent = QUALITY_LABEL[chord.quality] ?? chord.quality;

  badge.appendChild(symbol);
  badge.appendChild(quality);
  return badge;
}

// ── Form submit ───────────────────────────────────────────────────────────────

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const studentId = studentIdInput.value.trim();
  const title     = titleInput.value.trim();
  const chart     = chartInput.value.trim();

  if (!studentId || !title || !chart) {
    showError("Please fill in all fields.");
    return;
  }

  setLoading(true);
  resultsPanel.hidden = true;

  try {
    const data = await apiRequest("/api/analysis/chord-chart", {
      method: "POST",
      body: JSON.stringify({ studentId, title, chordChart: chart }),
    });

    // Render chord badges
    chordListEl.innerHTML = "";
    for (const chord of data.chords) {
      chordListEl.appendChild(renderChordBadge(chord));
    }

    // Render explanation
    explanationEl.textContent = data.explanation;

    // Set link to open composition in puzzle
    openLink.href = `/puzzle.html?id=${data.composition.id}`;

    resultsPanel.hidden = false;
    resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    let message = "Analysis failed. Please check your chord chart and try again.";
    try {
      const parsed = JSON.parse(err.message);
      if (parsed?.error) message = parsed.error;
    } catch {
      // use default message
    }
    showError(message);
  } finally {
    setLoading(false);
  }
});
