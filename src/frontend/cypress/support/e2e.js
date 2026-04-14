beforeEach(() => {
  cy.intercept("GET", "http://localhost:5000/health", {
    statusCode: 200,
    body: { status: "ok" }
  }).as("healthCheck");
});