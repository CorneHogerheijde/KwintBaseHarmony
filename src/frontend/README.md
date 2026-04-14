# KwintBaseHarmony Frontend

ASP.NET Core static frontend for KwintBaseHarmony, modeled after the `NoteStreamApp` approach from `dapr-workflow-concerto`.

## Setup

```bash
dotnet run --no-launch-profile --urls http://localhost:5051
```

The frontend serves static files from `wwwroot` on `http://localhost:5051` and talks to the backend API on `http://localhost:5000`.

## Cypress E2E Tests

Frontend end-to-end tests live alongside the static app and use Cypress with mocked backend responses so they can validate the browser flow without requiring the API to be running.

```bash
npm install
npm run test:e2e
```

Useful scripts:

```bash
npm run cy:open   # interactive Cypress runner
npm run cy:run    # headless Cypress run
npm run dev       # start the ASP.NET Core frontend host
```

`npm run test:e2e` uses a local Node runner that starts the frontend host, waits for it to respond, runs Cypress headlessly, and then shuts the host down again.

## Project Structure

```
Program.cs                          # Static file host and lightweight health endpoint
KwintBaseHarmony.Frontend.csproj    # Frontend project file
wwwroot/
├── index.html                      # Dashboard shell
├── styles.css                      # Frontend styles
└── app.js                          # Vanilla JS API client and UI logic
cypress/
├── e2e/
│   └── studio.cy.js                # Frontend workflow coverage with mocked API traffic
└── support/
	└── e2e.js                      # Cypress support entrypoint
```

The Cypress config is defined in `cypress.config.js`, and the Node test tooling is declared in `package.json`.
