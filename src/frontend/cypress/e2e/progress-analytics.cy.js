import { buildComposition } from "../support/composition-fixtures";

const API_BASE = "http://localhost:5000/api/compositions";
const COMPOSITION_ID = "1a2b3c4d-0000-4000-8000-000000000001";

function buildAnalyticsResponse(overrides = {}) {
  return {
    compositionId: COMPOSITION_ID,
    difficulty: "beginner",
    completionPercentage: overrides.completionPercentage ?? 57.1,
    summary: {
      completedLayers: overrides.completedLayers ?? 4,
      totalLayers: 7,
      totalTimeSpentMs: overrides.totalTimeSpentMs ?? 72000,
      averageAttemptsPerLayer: overrides.averageAttemptsPerLayer ?? 2.3,
      firstTryCorrectRate: overrides.firstTryCorrectRate ?? 0.5,
    },
    layers: Array.from({ length: 7 }, (_, i) => ({
      layerNumber: i + 1,
      name: `Layer ${i + 1}`,
      completed: i < (overrides.completedLayers ?? 4),
      timeSpentMs: (i + 1) * 10000,
      attempts: i < (overrides.completedLayers ?? 4) ? i + 1 : null,
      firstTryCorrect: i < (overrides.completedLayers ?? 4) ? i % 2 === 0 : null,
    })),
  };
}

// ── Progress page — load form ─────────────────────────────────────────────────

describe("Progress page — load form", () => {
  beforeEach(() => {
    cy.visit("/progress.html");
  });

  it("renders the load form", () => {
    cy.get("#progress-id-input").should("exist");
    cy.get("button[type=submit]").should("contain", "Load");
  });

  it("hides results sections initially", () => {
    cy.get("#summary-cards").should("have.class", "hidden");
    cy.get("#charts-section").should("have.class", "hidden");
    cy.get("#layer-table-section").should("have.class", "hidden");
  });

  it("shows an error when the API returns 404", () => {
    cy.intercept("GET", `${API_BASE}/${COMPOSITION_ID}/analytics`, {
      statusCode: 404,
      body: { error: "Composition not found" },
    }).as("analyticsNotFound");

    cy.get("#progress-id-input").type(COMPOSITION_ID);
    cy.get("form#progress-form").submit();

    cy.wait("@analyticsNotFound");
    cy.get("#progress-error").should("not.have.class", "hidden").and("contain", "Composition not found");
    cy.get("#summary-cards").should("have.class", "hidden");
  });
});

// ── Progress page — data display ──────────────────────────────────────────────

describe("Progress page — data display", () => {
  beforeEach(() => {
    const analytics = buildAnalyticsResponse();
    cy.intercept("GET", `${API_BASE}/${COMPOSITION_ID}/analytics`, {
      statusCode: 200,
      body: analytics,
    }).as("analytics");

    cy.visit(`/progress.html?id=${COMPOSITION_ID}`);
    cy.wait("@analytics");
  });

  it("shows the four summary stat cards", () => {
    cy.get("#summary-cards").should("not.have.class", "hidden");
    cy.get("#stat-completion-val").should("contain", "57%");
    cy.get("#stat-time-val").should("not.be.empty");
    cy.get("#stat-ftc-val").should("contain", "50%");
    cy.get("#stat-attempts-val").should("contain", "2.3");
  });

  it("renders the chart canvases", () => {
    cy.get("#charts-section").should("not.have.class", "hidden");
    cy.get("#chart-time").should("exist");
    cy.get("#chart-attempts").should("exist");
  });

  it("renders the layer table with 7 rows", () => {
    cy.get("#layer-table-section").should("not.have.class", "hidden");
    cy.get("#layer-table-body tr").should("have.length", 7);
  });

  it("marks completed layers with Done status", () => {
    cy.get("#layer-table-body tr").eq(0).find("td").eq(2).should("contain", "Done");
    cy.get("#layer-table-body tr").eq(0).find("td").eq(2).should("have.class", "status-done");
  });

  it("marks incomplete layers as In progress", () => {
    cy.get("#layer-table-body tr").eq(4).find("td").eq(2).should("contain", "In progress");
    cy.get("#layer-table-body tr").eq(4).find("td").eq(2).should("have.class", "status-pending");
  });

  it("renders dash for null attempts on incomplete layers", () => {
    cy.get("#layer-table-body tr").eq(4).find("td").eq(4).should("contain", "—");
  });
});

// ── Progress page — URL pre-population ───────────────────────────────────────

describe("Progress page — URL pre-population", () => {
  it("pre-fills the input when id is in the query string", () => {
    const analytics = buildAnalyticsResponse({ completionPercentage: 0, completedLayers: 0 });
    cy.intercept("GET", `${API_BASE}/${COMPOSITION_ID}/analytics`, {
      statusCode: 200,
      body: analytics,
    }).as("analytics");

    cy.visit(`/progress.html?id=${COMPOSITION_ID}`);
    cy.get("#progress-id-input").should("have.value", COMPOSITION_ID);
  });
});

// ── Puzzle page — progress link ───────────────────────────────────────────────

describe("Puzzle page — progress nav link", () => {
  it("shows a progress link pointing at progress.html?id=… after loading", () => {
    const composition = buildComposition({ id: COMPOSITION_ID });
    cy.intercept("GET", `${API_BASE}/${COMPOSITION_ID}`, {
      statusCode: 200,
      body: composition,
    }).as("getComposition");

    cy.visit(`/puzzle.html?id=${COMPOSITION_ID}`);
    cy.wait("@getComposition");

    cy.get("#progress-link")
      .should("not.have.class", "hidden")
      .and("have.attr", "href", `/progress.html?id=${COMPOSITION_ID}`);
  });
});

// ── Home page — progress footer link ────────────────────────────────────────

describe("Home page — progress footer link", () => {
  it("renders a Progress link in the footer", () => {
    cy.visit("/");
    cy.get('footer a[href="/progress.html"]').should("contain", "Progress");
  });
});
