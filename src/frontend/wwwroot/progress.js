const API_BASE = "/api/compositions";

// ── DOM refs ──────────────────────────────────────────────────────────────────
const form = document.getElementById("progress-form");
const idInput = document.getElementById("progress-id-input");
const errorEl = document.getElementById("progress-error");
const summaryCards = document.getElementById("summary-cards");
const chartsSection = document.getElementById("charts-section");
const layerTableSection = document.getElementById("layer-table-section");
const layerTableBody = document.getElementById("layer-table-body");

// Chart.js instances — kept so we can destroy/rebuild on reload
let timeChart = null;
let attemptsChart = null;

// ── URL pre-population ────────────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const idFromUrl = params.get("id");
if (idFromUrl) {
    idInput.value = idFromUrl;
    loadAnalytics(idFromUrl);
}

// ── Form submit ───────────────────────────────────────────────────────────────
form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = idInput.value.trim();
    if (!id) return;
    loadAnalytics(id);
});

// ── Core loader ───────────────────────────────────────────────────────────────
async function loadAnalytics(id) {
    setError("");

    const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}/analytics`);
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? `Server returned ${response.status}`);
        hideResults();
        return;
    }

    const data = await response.json();
    renderSummary(data.summary, data.completionPercentage);
    renderCharts(data.layers);
    renderTable(data.layers);
    showResults();
}

// ── Render helpers ────────────────────────────────────────────────────────────
function renderSummary(summary, completionPercentage) {
    document.getElementById("stat-completion-val").textContent =
        `${Math.round(completionPercentage)}%`;

    document.getElementById("stat-time-val").textContent =
        formatDuration(summary.totalTimeSpentMs);

    document.getElementById("stat-ftc-val").textContent =
        summary.firstTryCorrectRate != null
            ? `${Math.round(summary.firstTryCorrectRate * 100)}%`
            : "—";

    document.getElementById("stat-attempts-val").textContent =
        summary.averageAttemptsPerLayer != null
            ? summary.averageAttemptsPerLayer.toFixed(1)
            : "—";
}

function renderCharts(layers) {
    const labels = layers.map(l => `L${l.layerNumber}`);

    // ── Time chart ────────────────────────────────────────────────────────────
    const timeData = layers.map(l => +(l.timeSpentMs / 1000).toFixed(1));
    const timeColors = layers.map(l => l.completed ? "rgba(18,110,90,0.72)" : "rgba(18,110,90,0.25)");

    if (timeChart) timeChart.destroy();
    timeChart = new Chart(document.getElementById("chart-time"), {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Seconds",
                data: timeData,
                backgroundColor: timeColors,
                borderRadius: 6,
            }]
        },
        options: chartOptions("Seconds"),
    });

    // ── Attempts chart ────────────────────────────────────────────────────────
    const attemptsData = layers.map(l => l.attempts ?? 0);
    const ftcColors = layers.map(l =>
        l.firstTryCorrect === true  ? "rgba(18,110,90,0.72)"   // green — first try
        : l.firstTryCorrect === false ? "rgba(219,141,64,0.72)" // amber — retried
        : "rgba(18,110,90,0.25)"                                // grey — not yet
    );

    if (attemptsChart) attemptsChart.destroy();
    attemptsChart = new Chart(document.getElementById("chart-attempts"), {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Attempts",
                data: attemptsData,
                backgroundColor: ftcColors,
                borderRadius: 6,
            }]
        },
        options: chartOptions("Attempts"),
    });
}

function renderTable(layers) {
    layerTableBody.innerHTML = "";
    for (const l of layers) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${l.layerNumber}</td>
            <td>${escapeHtml(l.name)}</td>
            <td class="${l.completed ? "status-done" : "status-pending"}">${l.completed ? "✓ Done" : "In progress"}</td>
            <td>${(l.timeSpentMs / 1000).toFixed(1)}</td>
            <td>${l.attempts ?? "—"}</td>
            <td>${l.firstTryCorrect == null ? "—" : l.firstTryCorrect ? "Yes ✓" : "No"}</td>
        `;
        layerTableBody.appendChild(tr);
    }
}

// ── Visibility helpers ────────────────────────────────────────────────────────
function showResults() {
    summaryCards.classList.remove("hidden");
    chartsSection.classList.remove("hidden");
    layerTableSection.classList.remove("hidden");
}

function hideResults() {
    summaryCards.classList.add("hidden");
    chartsSection.classList.add("hidden");
    layerTableSection.classList.add("hidden");
}

function setError(message) {
    errorEl.textContent = message;
    errorEl.classList.toggle("hidden", !message);
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function formatDuration(ms) {
    if (ms < 1000) return `${ms} ms`;
    const totalSeconds = Math.round(ms / 1000);
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
}

function chartOptions(yLabel) {
    return {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => `${ctx.parsed.y} ${yLabel.toLowerCase()}` } }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: "#6d5b4b" },
                grid: { color: "rgba(47,36,29,0.08)" }
            },
            x: {
                ticks: { color: "#6d5b4b" },
                grid: { display: false }
            }
        }
    };
}

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
