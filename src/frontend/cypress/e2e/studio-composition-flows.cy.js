import { buildComposition } from "../support/composition-fixtures";

describe("KwintBaseHarmony studio composition flows", () => {
  it("creates a composition and renders all layers", () => {
    const composition = buildComposition({
      title: "Warmup in C",
      studentId: "student-cypress"
    });

    cy.intercept("POST", "http://localhost:5000/api/compositions", {
      statusCode: 201,
      body: composition
    }).as("createComposition");

    cy.visit("/dashboard.html");
    cy.wait("@healthCheck");

    cy.contains("Backend reachable on http://localhost:5000");
    cy.get("#student-id").type("student-cypress");
    cy.get("#composition-title").type("Warmup in C");
    cy.get("#difficulty").select("Intermediate");
    cy.get("#create-composition-form").submit();

    cy.wait("@createComposition")
      .its("request.body")
      .should("deep.equal", {
        studentId: "student-cypress",
        title: "Warmup in C",
        difficulty: "intermediate"
      });

    cy.get("#composition-summary").should("contain", "Warmup in C");
    cy.get("#composition-summary").should("contain", "student-cypress");
    cy.get("#layers .layer-card").should("have.length", 7);
    cy.get("#download-json").should("not.be.disabled");
    cy.get("#download-midi").should("not.be.disabled");
    cy.get("#activity-log").should("contain", "Created composition");
  });

  it("loads an existing composition and renders note chips", () => {
    const composition = buildComposition({
      id: "2fed9e13-21de-49cc-8aeb-799b6c97c020",
      title: "Loaded from API",
      studentId: "student-load",
      difficulty: "advanced",
      completionPercentage: 28.6,
      completedLayers: [1, 2],
      notesByLayer: {
        1: [
          {
            pitch: 60,
            durationMs: 500,
            timingMs: 0,
            velocity: 100,
            createdAt: "2026-04-14T20:10:36.1954987Z"
          }
        ]
      }
    });

    cy.intercept("GET", `http://localhost:5000/api/compositions/${composition.id}`, {
      statusCode: 200,
      body: composition
    }).as("loadComposition");

    cy.visit("/dashboard.html");
    cy.wait("@healthCheck");

    cy.get("#composition-id-input").type(composition.id);
    cy.get("#load-composition-form").submit();

    cy.wait("@loadComposition");
    cy.get("#composition-summary").should("contain", "Loaded from API");
    cy.get("#layers .layer-card").first().should("contain", "Completed");
    cy.get("#layers .note-chip").should("contain", "C4");
    cy.get("#activity-log").should("contain", "Loaded composition");
  });

  it("imports JSON and refreshes the editor with exported content", () => {
    const importedComposition = buildComposition({
      id: "4e8ab5a0-4774-46ba-a2cf-ef5c8f02ff31",
      title: "Imported from editor",
      studentId: "student-json",
      difficulty: "advanced",
      completionPercentage: 14.3,
      completedLayers: [1]
    });

    const exportedJson = JSON.stringify({
      id: importedComposition.id,
      studentId: importedComposition.studentId,
      title: importedComposition.title,
      difficulty: importedComposition.difficulty,
      completionPercentage: importedComposition.completionPercentage,
      layers: importedComposition.layers
    });

    cy.intercept("POST", "http://localhost:5000/api/compositions/import/json", {
      statusCode: 201,
      body: importedComposition
    }).as("importComposition");

    cy.intercept("GET", `http://localhost:5000/api/compositions/${importedComposition.id}/export/json`, {
      statusCode: 200,
      body: exportedJson,
      headers: {
        "content-type": "application/json; charset=utf-8"
      }
    }).as("exportJson");

    cy.visit("/dashboard.html");
    cy.wait("@healthCheck");

    cy.get("#json-editor").type(JSON.stringify({ title: "seed payload" }), {
      parseSpecialCharSequences: false
    });
    cy.get("#import-json").click();

    cy.wait("@importComposition");
    cy.wait("@exportJson");

    cy.get("#composition-summary").should("contain", "Imported from editor");
    cy.get("#json-editor").should("contain.value", '"Imported from editor"');
    cy.get("#activity-log").should("contain", "Imported composition JSON from editor");
  });

  it("opens the MIDI export URL for the loaded composition", () => {
    const composition = buildComposition({
      id: "c8347492-1479-44d8-a6d4-91ca75475daa",
      title: "MIDI Ready",
      studentId: "student-midi"
    });

    cy.intercept("POST", "http://localhost:5000/api/compositions", {
      statusCode: 201,
      body: composition
    }).as("createComposition");

    cy.visit("/dashboard.html");
    cy.wait("@healthCheck");

    cy.window().then((windowObject) => {
      cy.stub(windowObject, "open").as("windowOpen");
    });

    cy.get("#student-id").type("student-midi");
    cy.get("#composition-title").type("MIDI Ready");
    cy.get("#create-composition-form").submit();

    cy.wait("@createComposition");
    cy.get("#download-midi").click();

    cy.get("@windowOpen").should(
      "have.been.calledWith",
      `http://localhost:5000/api/compositions/${composition.id}/export/midi`,
      "_blank",
      "noopener,noreferrer"
    );
  });
});