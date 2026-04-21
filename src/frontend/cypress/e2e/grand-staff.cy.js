import { buildComposition } from "../support/composition-fixtures";

const API_BASE     = "http://localhost:5000/api/compositions";
const COMPOSITION_ID = "d5e6f7a8-b9c0-1234-defg-567890abcdef";

// ── Helper ────────────────────────────────────────────────────────────────────

function mountPuzzle(rootMidi = 60) {
  const composition = buildComposition({ id: COMPOSITION_ID, rootMidi, difficulty: "intermediate", style: "classical" });
  cy.intercept("GET", `${API_BASE}/${COMPOSITION_ID}`, { statusCode: 200, body: composition }).as("getComposition");
  cy.visit(`/puzzle.html?id=${COMPOSITION_ID}`);
  cy.wait("@getComposition");
}

// ── Grand staff — always rendered ─────────────────────────────────────────────

describe("Notation Preview — grand staff (Milestone 5.4)", () => {
  beforeEach(() => mountPuzzle(60));

  it("renders an SVG element inside #notation-staff", () => {
    cy.get("#notation-staff svg").should("exist");
  });

  it("renders exactly 10 staff lines (5 treble + 5 bass)", () => {
    // Staff lines are drawn as <line> elements with stroke "#7c6858"
    cy.get("#notation-staff svg line[stroke='#7c6858']").should("have.length.gte", 10);
  });

  it("shows both a treble clef (𝄞) and a bass clef (𝄢) symbol in the SVG", () => {
    cy.get("#notation-staff svg text").then(($texts) => {
      const contents = [...$texts].map((el) => el.textContent);
      // 𝄞 U+1D11E treble, 𝄢 U+1D122 bass
      expect(contents.some((t) => t.includes("\u{1D11E}"))).to.be.true;
      expect(contents.some((t) => t.includes("\u{1D122}"))).to.be.true;
    });
  });

  it("does NOT render a clef picker <select> on the puzzle page", () => {
    cy.get("#notation-clef").should("not.exist");
  });

  it("summary paragraph contains 'grand staff'", () => {
    cy.get("#notation-summary").should("contain.text", "grand staff");
  });
});

// ── Grand staff — octave-qualified note labels ────────────────────────────────

describe("Notation Preview — octave-qualified labels", () => {
  beforeEach(() => mountPuzzle(60));

  it("shows 'C4' label for middle C in the notation preview", () => {
    // The default selected pitch on page load is C4 (MIDI 60)
    cy.get("#notation-staff svg text").then(($texts) => {
      const contents = [...$texts].map((el) => el.textContent);
      expect(contents.some((t) => t === "C4")).to.be.true;
    });
  });

  it("summary text includes the octave-qualified label 'C4'", () => {
    cy.get("#notation-summary").should("contain.text", "C4");
  });
});

// ── Grand staff — middle C routing (ledger line) ──────────────────────────────

describe("Notation Preview — middle C appears between staves", () => {
  beforeEach(() => mountPuzzle(60));

  it("middle C note head Y is below treble bottom and above bass top lines", () => {
    // Treble bottom (E4, d=30) is at Y=100; bass top (A3, d=26) is at Y=140.
    // C4 (d=28) should have Y=120 — strictly between the two.
    cy.get("#notation-staff svg ellipse").then(($ellipses) => {
      // Find the selected (green) note head for C4
      const selected = [...$ellipses].find(
        (el) => el.getAttribute("fill") === "#126e5a"
      );
      expect(selected).to.exist;
      const cy_val = parseFloat(selected.getAttribute("cy"));
      expect(cy_val).to.be.greaterThan(100);  // below treble bottom
      expect(cy_val).to.be.lessThan(140);      // above bass top
    });
  });
});

// ── Grand staff — key signature on both staves ────────────────────────────────

describe("Notation Preview — G major key signature renders on both staves", () => {
  beforeEach(() => mountPuzzle(67)); // G major

  it("renders notation staff with a key signature (sharp symbols)", () => {
    cy.get("#notation-staff svg text").then(($texts) => {
      const contents = [...$texts].map((el) => el.textContent);
      expect(contents.some((t) => t.includes("♯"))).to.be.true;
    });
  });

  it("summary still mentions 'grand staff'", () => {
    cy.get("#notation-summary").should("contain.text", "grand staff");
  });
});
