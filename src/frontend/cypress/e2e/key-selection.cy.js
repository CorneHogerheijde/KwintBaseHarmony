import { buildComposition } from "../support/composition-fixtures";

const API_BASE = "http://localhost:5000/api/compositions";
const COMPOSITION_ID = "b2c3d4e5-f6a7-8901-bcde-f12345678901";

// ── Home page — key picker ────────────────────────────────────────────────────

describe("Home page — key picker", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("renders the key select with all 9 key options", () => {
    cy.get("#key-input").should("exist");
    cy.get("#key-input option[value='60']").should("contain.text", "C major");
    cy.get("#key-input option[value='67']").should("contain.text", "G major");
    cy.get("#key-input option[value='62']").should("contain.text", "D major");
    cy.get("#key-input option[value='69']").should("contain.text", "A major");
    cy.get("#key-input option[value='64']").should("contain.text", "E major");
    cy.get("#key-input option[value='65']").should("contain.text", "F major");
    cy.get("#key-input option[value='70']").should("contain.text", "B\u266d major");
    cy.get("#key-input option[value='63']").should("contain.text", "E\u266d major");
    cy.get("#key-input option[value='68']").should("contain.text", "A\u266d major");
  });

  it("defaults to C major (rootMidi 60)", () => {
    cy.get("#key-input").should("have.value", "60");
  });

  it("sends rootMidi 67 in POST body when G major is selected", () => {
    const composition = buildComposition({ id: COMPOSITION_ID, rootMidi: 67 });

    cy.intercept("POST", API_BASE, { statusCode: 201, body: composition }).as("createGMajor");

    cy.get("#student-id-input").type("Ada");
    cy.get("#title-input").type("G Major Study");
    cy.get("#key-input").select("67");
    cy.get("#start-form").submit();

    cy.wait("@createGMajor")
      .its("request.body")
      .should("deep.include", { rootMidi: 67 });
  });

  it("sends rootMidi 70 in POST body when Bb major is selected", () => {
    const composition = buildComposition({ id: COMPOSITION_ID, rootMidi: 70 });

    cy.intercept("POST", API_BASE, { statusCode: 201, body: composition }).as("createBbMajor");

    cy.get("#student-id-input").type("Ada");
    cy.get("#title-input").type("B\u266d Major Study");
    cy.get("#key-input").select("70");
    cy.get("#start-form").submit();

    cy.wait("@createBbMajor")
      .its("request.body")
      .should("deep.include", { rootMidi: 70 });
  });

  it("sends rootMidi 60 when C major (default) is submitted", () => {
    const composition = buildComposition({ id: COMPOSITION_ID, rootMidi: 60 });

    cy.intercept("POST", API_BASE, { statusCode: 201, body: composition }).as("createCMajor");

    cy.get("#student-id-input").type("Ada");
    cy.get("#title-input").type("C Major Study");
    cy.get("#start-form").submit();

    cy.wait("@createCMajor")
      .its("request.body")
      .should("deep.include", { rootMidi: 60 });
  });

  it("navigates to puzzle page after creating with key selection", () => {
    const composition = buildComposition({ id: COMPOSITION_ID, rootMidi: 67 });

    cy.intercept("POST", API_BASE, { statusCode: 201, body: composition }).as("create");

    cy.get("#student-id-input").type("Ada");
    cy.get("#title-input").type("G Major Test");
    cy.get("#key-input").select("67");
    cy.get("#start-form").submit();

    cy.wait("@create");
    cy.url().should("include", `/puzzle.html?id=${COMPOSITION_ID}`);
  });
});

// ── Puzzle page — key label ────────────────────────────────────────────────────

describe("Puzzle page — key label", () => {
  function mountPuzzleWithRoot(rootMidi) {
    const composition = buildComposition({
      id: COMPOSITION_ID,
      rootMidi,
      difficulty: "intermediate",
      style: "classical"
    });

    cy.intercept("GET", `${API_BASE}/${COMPOSITION_ID}`, { statusCode: 200, body: composition }).as("getComposition");
    cy.visit(`/puzzle.html?id=${COMPOSITION_ID}`);
    cy.wait("@getComposition");
  }

  it("shows 'C major' in root note label for C (rootMidi 60)", () => {
    mountPuzzleWithRoot(60);
    cy.get("#root-note-label").should("contain.text", "C major");
  });

  it("shows 'G major' in root note label for G (rootMidi 67)", () => {
    mountPuzzleWithRoot(67);
    cy.get("#root-note-label").should("contain.text", "G major");
  });

  it("shows 'B\u266d major' in root note label for Bb (rootMidi 70)", () => {
    mountPuzzleWithRoot(70);
    cy.get("#root-note-label").should("contain.text", "B\u266d major");
  });

  it("shows key accidentals in layer-root-note element for G major", () => {
    mountPuzzleWithRoot(67);
    cy.get("#layer-root-note").should("contain.text", "G major");
    cy.get("#layer-root-note").should("contain.text", "F\u266f");
  });

  it("shows no-accidentals message for C major", () => {
    mountPuzzleWithRoot(60);
    cy.get("#layer-root-note").should("contain.text", "C major");
    cy.get("#layer-root-note").should("contain.text", "no accidentals");
  });
});

// ── Puzzle page — Key Theory panel ───────────────────────────────────────────

describe("Puzzle page — Key Theory panel", () => {
  function mountPuzzleWithRoot(rootMidi) {
    const composition = buildComposition({
      id: COMPOSITION_ID,
      rootMidi,
      difficulty: "intermediate",
      style: "classical"
    });

    cy.intercept("GET", `${API_BASE}/${COMPOSITION_ID}`, { statusCode: 200, body: composition }).as("getComposition");
    cy.visit(`/puzzle.html?id=${COMPOSITION_ID}`);
    cy.wait("@getComposition");
  }

  it("renders the key theory panel element", () => {
    mountPuzzleWithRoot(60);
    cy.get("#key-theory-panel").should("exist");
  });

  it("theory panel summary is 'Key Theory'", () => {
    mountPuzzleWithRoot(60);
    cy.get("#key-theory-panel summary").should("contain.text", "Key Theory");
  });

  it("theory text for C major mentions 'no sharps or flats'", () => {
    mountPuzzleWithRoot(60);
    cy.get("#key-theory-panel").click();
    cy.get("#key-theory-text").should("contain.text", "no sharps or flats");
  });

  it("theory text for G major mentions F\u266f", () => {
    mountPuzzleWithRoot(67);
    cy.get("#key-theory-panel").click();
    cy.get("#key-theory-text").should("contain.text", "F\u266f");
  });

  it("theory text for B\u266d major mentions B\u266d", () => {
    mountPuzzleWithRoot(70);
    cy.get("#key-theory-panel").click();
    cy.get("#key-theory-text").should("contain.text", "B\u266d");
  });
});

// ── Home page — Key Journey guide ────────────────────────────────────────────

describe("Home page — Key Journey guide", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("renders the key journey guide container", () => {
    cy.get("#key-journey-guide").should("exist");
  });

  it("renders 9 key journey chips", () => {
    cy.get(".key-journey-chip").should("have.length", 9);
  });

  it("C chip is active by default", () => {
    cy.get(".key-journey-chip--active").should("contain.text", "C");
  });

  it("clicking a chip updates the key dropdown", () => {
    cy.get(".key-journey-chip").contains("G").click();
    cy.get("#key-input").should("have.value", "67");
  });

  it("clicking a chip marks it as active", () => {
    cy.get(".key-journey-chip").contains("G").click();
    cy.get(".key-journey-chip--active").should("contain.text", "G");
  });
});

// ── Home page — ?nextKey= pre-selection ──────────────────────────────────────

describe("Home page — nextKey query param", () => {
  it("pre-selects the key from ?nextKey= param", () => {
    cy.visit("/?nextKey=67");
    cy.get("#key-input").should("have.value", "67");
  });

  it("highlights the correct chip when pre-selected via ?nextKey=", () => {
    cy.visit("/?nextKey=67");
    cy.get(".key-journey-chip--active").should("contain.text", "G");
  });

  it("ignores an unrecognised ?nextKey= value and falls back to C major", () => {
    cy.visit("/?nextKey=61");
    cy.get("#key-input").should("have.value", "60");
  });
});
