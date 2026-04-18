export function buildComposition(overrides = {}) {
  const id = overrides.id ?? "9de798ef-0f73-4920-8ef2-4e3e9e9a1e10";
  const studentId = overrides.studentId ?? "student-001";
  const title = overrides.title ?? "Cypress Composition";
  const difficulty = overrides.difficulty ?? "beginner";
  const style = overrides.style ?? "classical";
  const completionPercentage = overrides.completionPercentage ?? 0;
  const notesByLayer = overrides.notesByLayer ?? {};
  const completedLayers = new Set(overrides.completedLayers ?? []);
  const movementNumber = overrides.movementNumber ?? 1;
  const parentCompositionId = overrides.parentCompositionId ?? null;
  const rootMidi = overrides.rootMidi ?? 60;

  return {
    id,
    studentId,
    title,
    difficulty,
    style,
    rootMidi,
    completionPercentage,
    movementNumber,
    parentCompositionId,
    createdAt: "2026-04-14T20:10:36.1954987Z",
    updatedAt: "2026-04-14T20:10:36.195534Z",
    layers: Array.from({ length: 7 }, (_, index) => {
      const layerNumber = index + 1;

      return {
        layerNumber,
        name: `Layer ${layerNumber}`,
        concept: `Concept ${layerNumber}`,
        completed: completedLayers.has(layerNumber),
        timeSpentMs: 0,
        userNotes: null,
        notes: notesByLayer[layerNumber] ?? []
      };
    })
  };
}