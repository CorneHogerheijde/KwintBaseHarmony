import { buildComposition } from "../support/composition-fixtures";

const BASE = "http://localhost:5000/api/compositions";
const PARENT_ID = "bbbbbbbb-0000-0000-0000-000000000001";
const MOVEMENT2_ID = "bbbbbbbb-0000-0000-0000-000000000002";

describe("Movement flow — completion prompt", () => {
  it("shows 'Continue to Movement II' button when movement 1 is complete and movementNumber < 3", () => {
    const composition = buildComposition({
      id: PARENT_ID,
      title: "Flow Test",
      studentId: "Ada",
      movementNumber: 1,
      completedLayers: [1, 2, 3, 4, 5, 6, 7],
      completionPercentage: 100
    });

    cy.intercept("GET", `${BASE}/${PARENT_ID}`, { statusCode: 200, body: composition }).as("loadComposition");
    cy.visit(`/puzzle.html?id=${PARENT_ID}`);
    cy.wait("@loadComposition");

    // Should go straight to completion panel since all layers done
    cy.get("#completion-panel").should("not.have.attr", "hidden");
    cy.get("#continue-movement-btn").should("not.have.attr", "hidden");
    cy.get("#continue-movement-btn").should("contain", "Movement II");
  });

  it("hides 'Continue to Movement' button when movementNumber is 3", () => {
    const composition = buildComposition({
      id: PARENT_ID,
      title: "Final Movement",
      studentId: "Ada",
      movementNumber: 3,
      completedLayers: [1, 2, 3, 4, 5, 6, 7],
      completionPercentage: 100
    });

    cy.intercept("GET", `${BASE}/${PARENT_ID}`, { statusCode: 200, body: composition }).as("loadFinal");
    cy.visit(`/puzzle.html?id=${PARENT_ID}`);
    cy.wait("@loadFinal");

    cy.get("#completion-panel").should("not.have.attr", "hidden");
    cy.get("#continue-movement-btn").should("have.attr", "hidden");
  });

  it("navigates to movement 2 puzzle page when Continue is clicked", () => {
    const movement2 = buildComposition({
      id: MOVEMENT2_ID,
      title: "Flow Test — II",
      studentId: "Ada",
      movementNumber: 2,
      parentCompositionId: PARENT_ID
    });

    const composition = buildComposition({
      id: PARENT_ID,
      title: "Flow Test",
      studentId: "Ada",
      movementNumber: 1,
      completedLayers: [1, 2, 3, 4, 5, 6, 7],
      completionPercentage: 100
    });

    cy.intercept("GET", `${BASE}/${PARENT_ID}`, { statusCode: 200, body: composition }).as("loadComposition");
    cy.intercept("POST", `${BASE}/${PARENT_ID}/movements`, { statusCode: 201, body: movement2 }).as("createMovement");
    cy.visit(`/puzzle.html?id=${PARENT_ID}`);
    cy.wait("@loadComposition");

    cy.get("#continue-movement-btn").click();
    cy.wait("@createMovement");

    cy.url().should("include", `id=${MOVEMENT2_ID}`);
  });
});

describe("Movement flow — multiple-choice puzzle (movement 3)", () => {
  it("hides piano and shows multiple-choice options for movement 3", () => {
    const composition = buildComposition({
      id: PARENT_ID,
      title: "Movement 3",
      studentId: "Ada",
      movementNumber: 3
    });

    cy.intercept("GET", `${BASE}/${PARENT_ID}`, { statusCode: 200, body: composition }).as("loadMov3");
    cy.visit(`/puzzle.html?id=${PARENT_ID}`);
    cy.wait("@loadMov3");

    cy.get("#piano-section").should("have.attr", "hidden");
    cy.get("#multiple-choice-options").should("not.have.class", "hidden");
    cy.get(".mc-option-btn").should("have.length", 4);
  });

  it("shows feedback and advances on correct multiple-choice answer", () => {
    const composition = buildComposition({
      id: PARENT_ID,
      title: "Movement 3",
      studentId: "Ada",
      movementNumber: 3
    });

    cy.intercept("GET", `${BASE}/${PARENT_ID}`, { statusCode: 200, body: composition }).as("loadMov3");
    cy.intercept("POST", `${BASE}/${PARENT_ID}/layers/*/notes`, { statusCode: 201, body: {} });
    cy.intercept("POST", `${BASE}/${PARENT_ID}/layers/*/complete`, { statusCode: 200, body: composition }).as("completeLayer");
    cy.visit(`/puzzle.html?id=${PARENT_ID}`);
    cy.wait("@loadMov3");

    cy.get(".mc-option-btn[data-correct='true']").click();
    cy.get(".puzzle-feedback").should("contain", "Correct");
  });

  it("flashes incorrect class and allows retry on wrong multiple-choice answer", () => {
    const composition = buildComposition({
      id: PARENT_ID,
      title: "Movement 3",
      studentId: "Ada",
      movementNumber: 3
    });

    cy.intercept("GET", `${BASE}/${PARENT_ID}`, { statusCode: 200, body: composition }).as("loadMov3");
    cy.visit(`/puzzle.html?id=${PARENT_ID}`);
    cy.wait("@loadMov3");

    cy.get(".mc-option-btn[data-correct='false']").first().click();
    cy.get(".puzzle-feedback").should("contain", "Not quite");
    // After timeout the button should be re-enabled
    cy.get(".mc-option-btn[data-correct='false']").first().should("not.be.disabled", { timeout: 2000 });
  });
});

describe("Home page — movement group display", () => {
  it("shows multi-movement compositions grouped under one entry", () => {
    const studentId = "Ada";
    const movement1 = buildComposition({
      id: PARENT_ID,
      title: "Chain Piece",
      studentId,
      movementNumber: 1,
      completedLayers: [1, 2, 3, 4, 5, 6, 7],
      completionPercentage: 100
    });
    const movement2 = buildComposition({
      id: MOVEMENT2_ID,
      title: "Chain Piece — II",
      studentId,
      movementNumber: 2,
      parentCompositionId: PARENT_ID
    });

    cy.intercept("GET", `${BASE}/student/${studentId}`, {
      statusCode: 200,
      body: [movement1, movement2]
    }).as("loadStudent");

    cy.visit("/");
    cy.get("#lookup-student-id").type(studentId);
    cy.get("#lookup-form button[type=submit]").click();
    cy.wait("@loadStudent");

    // Should show one grouped entry, not two
    cy.get(".composition-list-item").should("have.length", 1);
    cy.get(".comp-title").should("contain", "Chain Piece");
    cy.get(".comp-meta").should("contain", "2 movements");
  });
});
