describe("KwintBaseHarmony studio interactions", () => {
  it("syncs the virtual piano with the pitch field", () => {
    cy.visit("/");
    cy.wait("@healthCheck");

    cy.get("#selected-note-label").should("contain", "C4");
    cy.get('.piano-key[data-midi="64"]').click();

    cy.get("#pitch").should("have.value", "64");
    cy.get("#selected-note-label").should("contain", "E4");
    cy.get("#notation-summary").should("contain", "E4");
    cy.get("#notation-staff svg").should("exist");
    cy.get('.piano-key[data-midi="64"]').should("have.class", "is-active");
    cy.get("#activity-log").should("contain", "Selected note from virtual piano");
  });

  it("switches notation clefs without losing the selected note", () => {
    cy.visit("/");
    cy.wait("@healthCheck");

    cy.get("#notation-summary").should("contain", "treble clef");
    cy.get("#notation-clef").select("Bass");

    cy.get("#notation-summary").should("contain", "bass clef");
    cy.get("#selected-note-label").should("contain", "C4");
    cy.get("#notation-staff svg").should("exist");
  });
});