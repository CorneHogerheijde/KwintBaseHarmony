describe("KwintBaseHarmony studio interactions", () => {
  it("updates notation immediately when the pitch field changes", () => {
    cy.visit("/dashboard.html");
    cy.wait("@healthCheck");

    cy.get("#pitch").clear().type("67");

    cy.get("#selected-note-label").should("contain", "G4");
    cy.get("#notation-summary").should("contain", "G4");
    cy.get('.piano-key[data-midi="67"]').should("have.class", "is-active");
    cy.get("#notation-staff svg").should("exist");
  });

  it("syncs the virtual piano with the pitch field", () => {
    cy.visit("/dashboard.html");
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

  it("shows grand staff with selected note label and SVG present", () => {
    cy.visit("/dashboard.html");
    cy.wait("@healthCheck");

    cy.get("#notation-summary").should("contain", "grand staff");
    cy.get("#selected-note-label").should("contain", "C4");
    cy.get("#notation-staff svg").should("exist");
  });
});