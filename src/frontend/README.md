# KwintBaseHarmony Frontend

React + TypeScript frontend for KwintBaseHarmony music harmony learning app.

## Setup

```bash
npm install
npm run dev
```

The local development server is configured to run on `http://localhost:5051` so it matches the Dapr multi-app template in the project root.

## Project Structure

```
src/
├── components/
│   ├── PianoKeyboard.tsx      # Interactive piano UI
│   ├── NotationDisplay.tsx    # Musical notation rendering
│   ├── PuzzleUI.tsx           # Puzzle interface
│   └── ...
├── pages/
│   ├── Welcome.tsx            # Startup screen
│   ├── PuzzlePage.tsx         # Main puzzle interface
│   └── ...
├── services/
│   ├── api.ts                 # Backend API calls
│   ├── audio.ts               # Tone.js audio engine
│   └── ...
├── App.tsx
└── main.tsx
```

## Key Dependencies

- **Tone.js** — Web Audio API for synthesizer
- **Vexflow** — Musical notation rendering
- **Axios** — HTTP client for backend communication
- **Tailwind CSS** — Styling

## Development

```bash
npm run dev      # Start development server on http://localhost:5051
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run linter
```
