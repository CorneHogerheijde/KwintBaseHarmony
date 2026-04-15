const API_BASE = "http://localhost:5000/api/compositions";

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

function renderCompositionList(compositions) {
  compositionList.innerHTML = "";

  for (const comp of compositions) {
    const completed = comp.layers?.filter((l) => l.completed).length ?? 0;
    const total = comp.layers?.length ?? 7;
    const pct = Math.round((completed / total) * 100);

    const li = document.createElement("li");
    li.className = "composition-list-item";
    li.innerHTML = `
      <div class="comp-info">
        <strong class="comp-title">${escapeHtml(comp.title)}</strong>
        <span class="comp-meta">${completed}/${total} layers · ${pct}% complete</span>
      </div>
      <button type="button" class="primary-button comp-continue-btn" data-id="${escapeHtml(comp.id)}">
        Continue →
      </button>
    `;

    li.querySelector(".comp-continue-btn").addEventListener("click", () => {
      window.location.href = `/puzzle.html?id=${comp.id}`;
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
