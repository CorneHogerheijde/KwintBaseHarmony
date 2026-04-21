describe("Song Analysis page — Milestone 5.6", () => {
  beforeEach(() => {
    cy.visit("/analysis.html");
  });

  it("renders the chord chart form", () => {
    cy.get("#analysis-form").should("exist");
    cy.get("#chord-chart-input").should("exist");
    cy.get("#analyse-btn").should("exist");
  });

  it("shows validation error when form is submitted empty", () => {
    cy.get("#analyse-btn").click();
    // HTML5 required validation prevents submit — fields should be marked invalid
    cy.get("#student-id-input:invalid").should("exist");
  });

  it("calls POST /api/analysis/chord-chart and shows results", () => {
    const mockComposition = {
      id: "aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb",
      studentId: "Alice",
      title: "Axis of Awesome",
      difficulty: "intermediate",
      style: "classical",
      rootMidi: 60,
      completionPercentage: 0,
      movementNumber: 1,
      parentCompositionId: null,
      createdAt: "2026-04-21T10:00:00Z",
      updatedAt: "2026-04-21T10:00:00Z",
      layers: [],
    };

    const mockChords = [
      { symbol: "C",  root: "C", rootMidi: 60, quality: "major", isMinor: false },
      { symbol: "G",  root: "G", rootMidi: 67, quality: "major", isMinor: false },
      { symbol: "Am", root: "A", rootMidi: 69, quality: "minor", isMinor: true  },
      { symbol: "F",  root: "F", rootMidi: 65, quality: "major", isMinor: false },
    ];

    cy.intercept("POST", "/api/analysis/chord-chart", {
      statusCode: 201,
      body: {
        composition: mockComposition,
        chords: mockChords,
        explanation: "This is the popular I–V–vi–IV progression.",
      },
    }).as("analyseChart");

    cy.get("#student-id-input").type("Alice");
    cy.get("#title-input").type("Axis of Awesome");
    cy.get("#chord-chart-input").type("C - G - Am - F");
    cy.get("#analyse-btn").click();

    cy.wait("@analyseChart");

    // Results panel is visible
    cy.get("#analysis-results").should("not.have.attr", "hidden");

    // Chord badges rendered
    cy.get(".chord-badge").should("have.length", 4);
    cy.get(".chord-badge").first().should("contain.text", "C");

    // Explanation shown
    cy.get("#analysis-explanation").should("contain.text", "I–V–vi–IV");

    // Link points to the composition
    cy.get("#open-composition-link")
      .should("have.attr", "href")
      .and("include", mockComposition.id);
  });

  it("shows an error message when the API returns 400", () => {
    cy.intercept("POST", "/api/analysis/chord-chart", {
      statusCode: 400,
      body: JSON.stringify({ error: "No recognisable chords found in the chart." }),
    }).as("badRequest");

    cy.get("#student-id-input").type("Alice");
    cy.get("#title-input").type("Bad Chart");
    cy.get("#chord-chart-input").type("??? !!!");
    cy.get("#analyse-btn").click();

    cy.wait("@badRequest");

    cy.get("#analysis-error")
      .should("not.have.class", "hidden")
      .and("contain.text", "recognisable chords");
  });

  it("minor chord badges have a distinct CSS class", () => {
    cy.intercept("POST", "/api/analysis/chord-chart", {
      statusCode: 201,
      body: {
        composition: { id: "test-id", layers: [] },
        chords: [
          { symbol: "Am", root: "A", rootMidi: 69, quality: "minor", isMinor: true },
        ],
        explanation: "A minor tonic.",
      },
    }).as("analyseChart");

    cy.get("#student-id-input").type("Alice");
    cy.get("#title-input").type("Minor test");
    cy.get("#chord-chart-input").type("Am");
    cy.get("#analyse-btn").click();

    cy.wait("@analyseChart");

    cy.get(".chord-badge--minor").should("have.length", 1);
    cy.get(".chord-badge--major").should("have.length", 0);
  });

  it("is reachable from the homepage footer", () => {
    cy.visit("/");
    cy.get('a[href="/analysis.html"]').should("exist").and("contain.text", "Song Analysis");
  });
});
