import { buildComposition } from "../support/composition-fixtures";

const API_BASE = "http://localhost:5000/api/compositions";
const COMPOSITION_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

// ── Home page — style picker ──────────────────────────────────────────────────

describe("Home page — style picker", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("renders the style select with classical, jazz, and blues options", () => {
    cy.get("#style-input").should("exist");
    cy.get("#style-input option[value='classical']").should("exist");
    cy.get("#style-input option[value='jazz']").should("exist");
    cy.get("#style-input option[value='blues']").should("exist");
  });

  it("defaults to classical style", () => {
    cy.get("#style-input").should("have.value", "classical");
  });

  it("sends jazz style in POST body when jazz is selected", () => {
    const composition = buildComposition({ id: COMPOSITION_ID, studentId: "Miles", title: "Jazz Study", style: "jazz" });

    cy.intercept("POST", API_BASE, { statusCode: 201, body: composition }).as("createJazz");

    cy.get("#student-id-input").type("Miles");
    cy.get("#title-input").type("Jazz Study");
    cy.get("#difficulty-input").select("intermediate");
    cy.get("#style-input").select("jazz");
    cy.get("#start-form").submit();

    cy.wait("@createJazz")
      .its("request.body")
      .should("include", { studentId: "Miles", title: "Jazz Study", difficulty: "intermediate", style: "jazz" });

    cy.url().should("include", `/puzzle.html?id=${COMPOSITION_ID}`);
  });

  it("sends blues style in POST body when blues is selected", () => {
    const composition = buildComposition({ id: COMPOSITION_ID, studentId: "BB", title: "Blues Study", style: "blues" });

    cy.intercept("POST", API_BASE, { statusCode: 201, body: composition }).as("createBlues");

    cy.get("#student-id-input").type("BB");
    cy.get("#title-input").type("Blues Study");
    cy.get("#style-input").select("blues");
    cy.get("#start-form").submit();

    cy.wait("@createBlues")
      .its("request.body")
      .should("include", { style: "blues" });
  });
});

// ── Puzzle page — style badge ─────────────────────────────────────────────────

describe("Puzzle page — style badge", () => {
  it("does not show a style badge for classical compositions", () => {
    const composition = buildComposition({ id: COMPOSITION_ID, style: "classical" });

    cy.intercept("GET", `${API_BASE}/${COMPOSITION_ID}`, { body: composition }).as("getComp");

    cy.visit(`/puzzle.html?id=${COMPOSITION_ID}`);
    cy.wait("@getComp");

    cy.get("#style-badge").should("not.exist");
  });

  it("shows a jazz badge for jazz compositions", () => {
    const composition = buildComposition({ id: COMPOSITION_ID, style: "jazz", title: "Jazz Study", studentId: "Miles" });

    cy.intercept("GET", `${API_BASE}/${COMPOSITION_ID}`, { body: composition }).as("getComp");

    cy.visit(`/puzzle.html?id=${COMPOSITION_ID}`);
    cy.wait("@getComp");

    cy.get("#style-badge")
      .should("be.visible")
      .and("have.class", "style-badge--jazz")
      .and("contain.text", "Jazz");
  });

  it("shows a blues badge for blues compositions", () => {
    const composition = buildComposition({ id: COMPOSITION_ID, style: "blues", title: "Blues Study", studentId: "BB" });

    cy.intercept("GET", `${API_BASE}/${COMPOSITION_ID}`, { body: composition }).as("getComp");

    cy.visit(`/puzzle.html?id=${COMPOSITION_ID}`);
    cy.wait("@getComp");

    cy.get("#style-badge")
      .should("be.visible")
      .and("have.class", "style-badge--blues")
      .and("contain.text", "Blues");
  });
});
