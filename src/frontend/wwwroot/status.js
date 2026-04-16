const apiStatusEl = document.getElementById("api-status");
const refreshBtn = document.getElementById("refresh-status");

function setStatusPill(el, message, healthy) {
  el.textContent = message;
  el.style.background = healthy ? "rgba(18, 110, 90, 0.1)" : "rgba(187, 94, 48, 0.14)";
  el.style.color = healthy ? "#0b4e40" : "#8b3a16";
}

const _backendBase = window.APP_CONFIG?.apiBase ?? "http://localhost:5000";

async function checkApi() {
  setStatusPill(apiStatusEl, "Checking\u2026", true);
  try {
    const response = await fetch(`${_backendBase}/health`, { method: "GET", mode: "cors" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    setStatusPill(apiStatusEl, `Reachable \u2014 ${_backendBase}`, true);
  } catch {
    setStatusPill(apiStatusEl, `Not reachable on ${_backendBase}`, false);
  }
}

refreshBtn.addEventListener("click", checkApi);

void checkApi();
