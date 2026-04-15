import { buildComposition } from "../support/composition-fixtures";

const BASE = "http://localhost:5000/api/compositions";
const COMPOSITION_ID = "aaaaaaaa-0000-0000-0000-000000000001";

// Layer 1 target is C4 (MIDI 60), Layer 2 target is G4 (MIDI 67)
const LAYER_1_CORRECT_MIDI = 60;
const LAYER_1_WRONG_MIDI = 62; // D4

describe("Puzzle page — initial state", () => {
  beforeEach(() => {
    const composition = buildComposition({ id: COMPOSITION_ID, title: "My Harmony", studentId: "Ada" });
    cy.intercept("GET", `${BASE}/${COMPOSITION_ID}`, { statusCode: 200, body: composition }).as("loadComposition");
    cy.visit(`/puzzle.html?id=${COMPOSITION_ID}`);
    cy.wait("@loadComposition");
  });

  it("shows the composition title and layer 1 prompt", () => {
    cy.get("#composition-title-label").should("contain", "My Harmony");
    cy.get("#puzzle-layer-name").should("contain", "Layer 1 of 7");
    cy.get("#puzzle-layer-name").should("contain", "Foundation");
    cy.get("#puzzle-progress-label").should("contain", "0 of 7 layers complete");
  });

  it("disables 'Previous Layer' on layer 1", () => {
    cy.get("#prev-layer-btn").should("be.disabled");
  });

  it("disables 'Play Everything So Far' on layer 1", () => {
    cy.get("#play-all-btn").should("be.disabled");
  });

  it("has 'Mark Layer Complete' disabled initially", () => {
    cy.get("#mark-complete-btn").should("be.disabled");
  });
});

describe("Puzzle page — Show Answer (intermediate)", () => {
  beforeEach(() => {
    const composition = buildComposition({ id: COMPOSITION_ID, title: "My Harmony", studentId: "Ada", difficulty: "intermediate" });
    cy.intercept("GET", `${BASE}/${COMPOSITION_ID}`, { statusCode: 200, body: composition }).as("loadComposition");
    cy.visit(`/puzzle.html?id=${COMPOSITION_ID}`);
    cy.wait("@loadComposition");
  });

  it("shows the 'Show Answer' button for intermediate difficulty", () => {
    cy.get("#show-answer-btn").should("not.have.attr", "hidden");
  });

  it("highlights the correct piano key and shows the hint text", () => {
    cy.get("#show-answer-btn").click();
    cy.get(`.piano-key[data-midi="${LAYER_1_CORRECT_MIDI}"]`).should("have.class", "is-hint");
    cy.get("#puzzle-hint").should("not.have.class", "hidden");
  });

  it("keeps the hint key highlighted after selecting another note", () => {
    cy.get("#show-answer-btn").click();
    cy.get(`.piano-key[data-midi="${LAYER_1_WRONG_MIDI}"]`).click();
    cy.get(`.piano-key[data-midi="${LAYER_1_CORRECT_MIDI}"]`).should("have.class", "is-hint");
  });
});

describe("Puzzle page — Beginner difficulty", () => {
  beforeEach(() => {
    const composition = buildComposition({ id: COMPOSITION_ID, title: "My Harmony", studentId: "Ada", difficulty: "beginner" });
    cy.intercept("GET", `${BASE}/${COMPOSITION_ID}`, { statusCode: 200, body: composition }).as("loadComposition");
    cy.visit(`/puzzle.html?id=${COMPOSITION_ID}`);
    cy.wait("@loadComposition");
  });

  it("shows the hint automatically without clicking 'Show Answer'", () => {
    cy.get("#puzzle-hint").should("not.have.class", "hidden");
  });

  it("hides the 'Show Answer' button", () => {
    cy.get("#show-answer-btn").should("have.attr", "hidden");
  });

  it("accepts MIDI 60 (C4) as the correct answer for layer 1", () => {
    cy.get(`.piano-key[data-midi="${LAYER_1_CORRECT_MIDI}"]`).click();
    cy.get("#mark-complete-btn").should("not.be.disabled");
    cy.get("#puzzle-feedback").should("contain", "Correct");
  });
});

describe("Puzzle page — Advanced difficulty", () => {
  // Advanced layer 1 target is C3 (MIDI 48)
  const ADVANCED_LAYER_1_MIDI = 48;

  beforeEach(() => {
    const composition = buildComposition({ id: COMPOSITION_ID, title: "My Harmony", studentId: "Ada", difficulty: "advanced" });
    cy.intercept("GET", `${BASE}/${COMPOSITION_ID}`, { statusCode: 200, body: composition }).as("loadComposition");
    cy.visit(`/puzzle.html?id=${COMPOSITION_ID}`);
    cy.wait("@loadComposition");
  });

  it("hides the hint by default", () => {
    cy.get("#puzzle-hint").should("have.class", "hidden");
  });

  it("accepts MIDI 48 (C3) as the correct answer for layer 1", () => {
    cy.get(`.piano-key[data-midi="${ADVANCED_LAYER_1_MIDI}"]`).click();
    cy.get("#mark-complete-btn").should("not.be.disabled");
    cy.get("#puzzle-feedback").should("contain", "Correct");
  });

  it("rejects MIDI 60 (C4 — correct for beginner/intermediate) for layer 1", () => {
    cy.get(`.piano-key[data-midi="${LAYER_1_CORRECT_MIDI}"]`).click();
    cy.get("#mark-complete-btn").should("be.disabled");
  });
});

describe("Puzzle page — note selection feedback", () => {
  beforeEach(() => {
    const composition = buildComposition({ id: COMPOSITION_ID, title: "My Harmony", studentId: "Ada" });
    cy.intercept("GET", `${BASE}/${COMPOSITION_ID}`, { statusCode: 200, body: composition }).as("loadComposition");
    cy.visit(`/puzzle.html?id=${COMPOSITION_ID}`);
    cy.wait("@loadComposition");
  });

  it("enables 'Mark Layer Complete' and shows success feedback when the correct note is selected", () => {
    cy.get(`.piano-key[data-midi="${LAYER_1_CORRECT_MIDI}"]`).click();
    cy.get("#mark-complete-btn").should("not.be.disabled");
    cy.get("#puzzle-feedback").should("contain", "Correct");
  });

  it("keeps 'Mark Layer Complete' disabled when a wrong note is selected", () => {
    cy.get(`.piano-key[data-midi="${LAYER_1_WRONG_MIDI}"]`).click();
    cy.get("#mark-complete-btn").should("be.disabled");
  });
});

describe("Puzzle page — completing layer 1 and advancing", () => {
  beforeEach(() => {
    const fresh = buildComposition({ id: COMPOSITION_ID, title: "My Harmony", studentId: "Ada" });
    const afterNote = buildComposition({
      id: COMPOSITION_ID,
      title: "My Harmony",
      studentId: "Ada",
      notesByLayer: {
        1: [{ pitch: 60, durationMs: 500, timingMs: 0, velocity: 100, createdAt: "2026-04-15T00:00:00Z" }]
      }
    });
    const afterComplete = buildComposition({
      id: COMPOSITION_ID,
      title: "My Harmony",
      studentId: "Ada",
      completedLayers: [1],
      notesByLayer: {
        1: [{ pitch: 60, durationMs: 500, timingMs: 0, velocity: 100, createdAt: "2026-04-15T00:00:00Z" }]
      }
    });

    cy.intercept("GET", `${BASE}/${COMPOSITION_ID}`, { statusCode: 200, body: fresh }).as("loadComposition");
    cy.intercept("POST", `${BASE}/${COMPOSITION_ID}/layers/1/notes`, { statusCode: 201, body: afterNote }).as("addNote");
    cy.intercept("POST", `${BASE}/${COMPOSITION_ID}/layers/1/complete`, { statusCode: 200, body: afterComplete }).as("completeLayer");

    cy.visit(`/puzzle.html?id=${COMPOSITION_ID}`);
    cy.wait("@loadComposition");
    cy.get(`.piano-key[data-midi="${LAYER_1_CORRECT_MIDI}"]`).click();
    cy.get("#mark-complete-btn").click();
    cy.wait("@addNote");
    cy.wait("@completeLayer");
  });

  it("advances to layer 2", () => {
    cy.get("#puzzle-layer-name").should("contain", "Layer 2 of 7");
    cy.get("#puzzle-layer-name").should("contain", "The Fifth");
  });

  it("enables 'Previous Layer' on layer 2", () => {
    cy.get("#prev-layer-btn").should("not.be.disabled");
  });

  it("enables 'Play Everything So Far' on layer 2", () => {
    cy.get("#play-all-btn").should("not.be.disabled");
  });

  it("updates the progress label", () => {
    cy.get("#puzzle-progress-label").should("contain", "1 of 7 layers complete");
  });
});

describe("Puzzle page — Previous Layer navigation", () => {
  beforeEach(() => {
    const layer1Complete = buildComposition({
      id: COMPOSITION_ID,
      title: "My Harmony",
      studentId: "Ada",
      completedLayers: [1],
      notesByLayer: {
        1: [{ pitch: 60, durationMs: 500, timingMs: 0, velocity: 100, createdAt: "2026-04-15T00:00:00Z" }]
      }
    });
    cy.intercept("GET", `${BASE}/${COMPOSITION_ID}`, { statusCode: 200, body: layer1Complete }).as("loadComposition");
    cy.visit(`/puzzle.html?id=${COMPOSITION_ID}`);
    cy.wait("@loadComposition");
    // Starts on layer 2 (first incomplete)
    cy.get("#puzzle-layer-name").should("contain", "Layer 2 of 7");
  });

  it("goes back to layer 1 when 'Previous Layer' is clicked from layer 2", () => {
    cy.get("#prev-layer-btn").click();
    cy.get("#puzzle-layer-name").should("contain", "Layer 1 of 7");
  });

  it("disables 'Previous Layer' after navigating back to layer 1", () => {
    cy.get("#prev-layer-btn").click();
    cy.get("#prev-layer-btn").should("be.disabled");
  });

  it("disables 'Play Everything So Far' when on a completed layer 1 (layer 1 = disabled)", () => {
    cy.get("#prev-layer-btn").click();
    cy.get("#play-all-btn").should("be.disabled");
  });

  it("shows 'Back to Puzzle' button text on a completed layer", () => {
    cy.get("#prev-layer-btn").click();
    cy.get("#skip-layer-btn").should("contain", "Back to Puzzle");
  });

  it("'Back to Puzzle' jumps back to the first incomplete layer (layer 2)", () => {
    cy.get("#prev-layer-btn").click();
    cy.get("#skip-layer-btn").click();
    cy.get("#puzzle-layer-name").should("contain", "Layer 2 of 7");
  });
});

describe("Puzzle page — Skip Layer", () => {
  beforeEach(() => {
    const fresh = buildComposition({ id: COMPOSITION_ID, title: "My Harmony", studentId: "Ada" });
    const afterSkip = buildComposition({ id: COMPOSITION_ID, title: "My Harmony", studentId: "Ada", completedLayers: [1] });

    cy.intercept("GET", `${BASE}/${COMPOSITION_ID}`, { statusCode: 200, body: fresh }).as("loadComposition");
    cy.intercept("POST", `${BASE}/${COMPOSITION_ID}/layers/1/complete`, { statusCode: 200, body: afterSkip }).as("skipLayer");

    cy.visit(`/puzzle.html?id=${COMPOSITION_ID}`);
    cy.wait("@loadComposition");
  });

  it("skips layer 1 and advances to layer 2", () => {
    cy.get("#skip-layer-btn").click();
    cy.wait("@skipLayer");
    cy.get("#puzzle-layer-name").should("contain", "Layer 2 of 7");
  });
});
