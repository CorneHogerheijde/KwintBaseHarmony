# KwintBaseHarmony Frontend

ASP.NET Core static frontend for KwintBaseHarmony, modeled after the `NoteStreamApp` approach from `dapr-workflow-concerto`.

## Setup

```bash
dotnet run --no-launch-profile --urls http://localhost:5051
```

The frontend serves static files from `wwwroot` on `http://localhost:5051` and talks to the backend API on `http://localhost:5000`.

## Project Structure

```
Program.cs                          # Static file host and lightweight health endpoint
KwintBaseHarmony.Frontend.csproj    # Frontend project file
wwwroot/
├── index.html                      # Dashboard shell
├── styles.css                      # Frontend styles
└── app.js                          # Vanilla JS API client and UI logic
```
