const apiStatusEl = document.getElementById("api-status");
const daprStatusEl = document.getElementById("dapr-status");
const refreshBtn = document.getElementById("refresh-status");
const refreshDaprBtn = document.getElementById("refresh-dapr");

function setStatusPill(el, message, healthy) {
  el.textContent = message;
  el.style.background = healthy ? "rgba(18, 110, 90, 0.1)" : "rgba(187, 94, 48, 0.14)";
  el.style.color = healthy ? "#0b4e40" : "#8b3a16";
}

async function checkApi() {
  setStatusPill(apiStatusEl, "Checking…", true);
  try {
    const response = await fetch("http://localhost:5000/health", { method: "GET", mode: "cors" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    setStatusPill(apiStatusEl, "Reachable — http://localhost:5000", true);
  } catch {
    setStatusPill(apiStatusEl, "Not reachable on http://localhost:5000", false);
  }
}

async function checkDapr() {
  setStatusPill(daprStatusEl, "Checking…", true);
  try {
    const response = await fetch("http://localhost:3500/v1.0/healthz", { method: "GET", mode: "cors" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    setStatusPill(daprStatusEl, "Reachable — http://localhost:3500", true);
  } catch {
    setStatusPill(daprStatusEl, "Not reachable on http://localhost:3500", false);
  }
}

refreshBtn.addEventListener("click", checkApi);
refreshDaprBtn.addEventListener("click", checkDapr);

void checkApi();
void checkDapr();
