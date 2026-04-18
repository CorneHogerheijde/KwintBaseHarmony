import { buildComposition } from "../support/composition-fixtures";

const API_BASE = "http://localhost:5000/api/compositions";
const COMPOSITION_ID = "9de798ef-0f73-4920-8ef2-4e3e9e9a1e10";

// ── Start a new composition ───────────────────────────────────────────────────

describe("Home page — start a new composition", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("renders the start form with the correct fields", () => {
    cy.get("#student-id-input").should("exist");
    cy.get("#title-input").should("exist");
    cy.get("#difficulty-input").should("exist");
    cy.get("#start-submit-btn").should("contain", "Start Puzzle");
  });

  it("redirects to puzzle.html after a successful create", () => {
    const composition = buildComposition({ id: COMPOSITION_ID, studentId: "Ada", title: "Test Piece" });

    cy.intercept("POST", API_BASE, { statusCode: 201, body: composition }).as("createComposition");

    cy.get("#student-id-input").type("Ada");
    cy.get("#title-input").type("Test Piece");
    cy.get("#difficulty-input").select("beginner");
    cy.get("#start-form").submit();

    cy.wait("@createComposition")
      .its("request.body")
      .should("deep.include", { studentId: "Ada", title: "Test Piece", difficulty: "beginner", style: "classical", rootMidi: 60 });

    cy.url().should("include", `/puzzle.html?id=${COMPOSITION_ID}`);
  });

  it("shows an error message when the API returns 400", () => {
    cy.intercept("POST", API_BASE, {
      statusCode: 400,
      body: { error: "Title is required." }
    }).as("createFail");

    cy.get("#student-id-input").type("Ada");
    cy.get("#title-input").type("Bad Piece");
    cy.get("#start-form").submit();

    cy.wait("@createFail");
    cy.get("#start-error").should("be.visible").and("contain", "Title is required.");
  });

  it("keeps the submit button disabled while the request is in-flight", () => {
    const composition = buildComposition({ id: COMPOSITION_ID });

    cy.intercept("POST", API_BASE, (req) => {
      req.reply({ delay: 300, statusCode: 201, body: composition });
    }).as("createSlow");

    cy.get("#student-id-input").type("Ada");
    cy.get("#title-input").type("Slow Piece");
    cy.get("#start-form").submit();

    cy.get("#start-submit-btn").should("be.disabled");
    cy.wait("@createSlow");
  });
});

// ── Resume an existing composition ───────────────────────────────────────────

describe("Home page — resume an existing composition", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("renders the lookup form", () => {
    cy.get("#lookup-student-id").should("exist");
    cy.get("#lookup-form button[type=submit]").should("exist");
    cy.get("#composition-list").should("have.class", "hidden");
  });

  it("shows a list of compositions when the lookup succeeds", () => {
    const comp1 = buildComposition({ id: COMPOSITION_ID, studentId: "Ada", title: "First Piece" });
    const comp2 = buildComposition({
      id: "bbbbbbbb-0000-0000-0000-000000000002",
      studentId: "Ada",
      title: "Second Piece",
      completedLayers: [1, 2]
    });

    cy.intercept("GET", `${API_BASE}/student/Ada`, { statusCode: 200, body: [comp1, comp2] }).as("lookup");

    cy.get("#lookup-student-id").type("Ada");
    cy.get("#lookup-form").submit();

    cy.wait("@lookup");
    cy.get("#composition-list").should("not.have.class", "hidden");
    cy.get("#composition-list .composition-list-item").should("have.length", 2);
    cy.get("#composition-list .composition-list-item").first().should("contain", "First Piece");
    cy.get("#composition-list .composition-list-item").last().should("contain", "Second Piece");
    cy.get("#composition-list .composition-list-item").last().should("contain", "2/7");
  });

  it("shows a 'no compositions' message when the student has none", () => {
    cy.intercept("GET", `${API_BASE}/student/Unknown`, { statusCode: 200, body: [] }).as("emptyLookup");

    cy.get("#lookup-student-id").type("Unknown");
    cy.get("#lookup-form").submit();

    cy.wait("@emptyLookup");
    cy.get("#no-compositions").should("not.have.class", "hidden");
    cy.get("#composition-list").should("have.class", "hidden");
  });

  it("navigates to puzzle.html when Continue is clicked", () => {
    const comp = buildComposition({ id: COMPOSITION_ID, studentId: "Ada", title: "My Piece" });

    cy.intercept("GET", `${API_BASE}/student/Ada`, { statusCode: 200, body: [comp] }).as("lookup");

    cy.get("#lookup-student-id").type("Ada");
    cy.get("#lookup-form").submit();

    cy.wait("@lookup");
    cy.get(".comp-continue-btn").first().click();

    cy.url().should("include", `/puzzle.html?id=${COMPOSITION_ID}`);
  });

  it("shows an error when lookup fails", () => {
    cy.intercept("GET", `${API_BASE}/student/Error`, {
      statusCode: 500,
      body: "Internal server error"
    }).as("lookupFail");

    cy.get("#lookup-student-id").type("Error");
    cy.get("#lookup-form").submit();

    cy.wait("@lookupFail");
    cy.get("#lookup-error").should("be.visible");
  });
});
