const API_BASE = `${window.APP_CONFIG?.apiBase ?? "http://localhost:5000"}/api/compositions`;

const startForm = document.getElementById("start-form");
const studentIdInput = document.getElementById("student-id-input");
const titleInput = document.getElementById("title-input");
const difficultyInput = document.getElementById("difficulty-input");
const startSubmitBtn = document.getElementById("start-submit-btn");
const startError = document.getElementById("start-error");

const lookupForm = document.getElementById("lookup-form");
const lookupStudentId = document.getElementById("lookup-student-id");
const lookupError = document.getElementById("lookup-error");
const compositionList = document.getElementById("composition-list");
const noCompositions = document.getElementById("no-compositions");

// ── Helpers ───────────────────────────────────────────────────────────────────

function showError(el, message) {
  el.textContent = message;
  el.classList.remove("hidden");
}

function clearError(el) {
  el.textContent = "";
  el.classList.add("hidden");
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.dataset.originalText = btn.dataset.originalText ?? btn.textContent;
  btn.textContent = loading ? "Please wait…" : btn.dataset.originalText;
}

async function apiPost(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }

  return response.json();
}

// ── Build the composition list ────────────────────────────────────────────────

function getMovementGroups(compositions) {
  // Bucket compositions by their root ID (movement 1's ID)
  const byRoot = new Map();

  for (const comp of compositions) {
    const rootId = comp.movementNumber === 1 ? comp.id : comp.parentCompositionId ?? comp.id;
    if (!byRoot.has(rootId)) byRoot.set(rootId, []);
    byRoot.get(rootId).push(comp);
  }

  // Sort each group by movementNumber, return as array of groups
  return [...byRoot.values()].map((group) =>
    group.sort((a, b) => (a.movementNumber ?? 1) - (b.movementNumber ?? 1))
  );
}

function renderCompositionList(compositions) {
  compositionList.innerHTML = "";

  const groups = getMovementGroups(compositions);

  for (const group of groups) {
    const root = group[0];
    // Sum progress across all movements
    const totalLayers = group.reduce((sum, c) => sum + (c.layers?.length ?? 7), 0);
    const completedLayers = group.reduce((sum, c) => sum + (c.layers?.filter((l) => l.completed).length ?? 0), 0);
    const pct = Math.round((completedLayers / totalLayers) * 100);

    // Find the lowest-numbered incomplete movement to navigate to
    const incompleteMovement = group.find((c) => {
      const completed = c.layers?.filter((l) => l.completed).length ?? 0;
      const total = c.layers?.length ?? 7;
      return completed < total;
    }) ?? group[group.length - 1];

    const movementLabel = group.length > 1 ? ` · ${group.length} movements` : "";

    const li = document.createElement("li");
    li.className = "composition-list-item";
    li.innerHTML = `
      <div class="comp-info">
        <strong class="comp-title">${escapeHtml(root.title)}</strong>
        <span class="comp-meta">${completedLayers}/${totalLayers} layers · ${pct}% complete${escapeHtml(movementLabel)}</span>
      </div>
      <button type="button" class="primary-button comp-continue-btn" data-id="${escapeHtml(incompleteMovement.id)}">
        Continue →
      </button>
    `;

    li.querySelector(".comp-continue-btn").addEventListener("click", () => {
      window.location.href = `/puzzle.html?id=${incompleteMovement.id}`;
    });

    compositionList.appendChild(li);
  }

  compositionList.classList.remove("hidden");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Start form ────────────────────────────────────────────────────────────────

startForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError(startError);

  const studentId = studentIdInput.value.trim();
  const title = titleInput.value.trim();
  const difficulty = difficultyInput.value;

  setLoading(startSubmitBtn, true);

  try {
    const composition = await apiPost("", { studentId, title, difficulty });
    window.location.href = `/puzzle.html?id=${composition.id}`;
  } catch (error) {
    showError(startError, error.message);
    setLoading(startSubmitBtn, false);
  }
});

// ── Lookup form ───────────────────────────────────────────────────────────────

lookupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError(lookupError);
  compositionList.classList.add("hidden");
  noCompositions.classList.add("hidden");

  const studentId = lookupStudentId.value.trim();
  const lookupBtn = lookupForm.querySelector("button[type=submit]");
  setLoading(lookupBtn, true);

  try {
    const compositions = await apiGet(`/student/${encodeURIComponent(studentId)}`);

    if (compositions.length === 0) {
      noCompositions.classList.remove("hidden");
    } else {
      renderCompositionList(compositions);
    }
  } catch (error) {
    showError(lookupError, error.message);
  } finally {
    setLoading(lookupBtn, false);
  }
});
