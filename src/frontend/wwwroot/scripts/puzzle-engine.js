/**
 * Puzzle layer definitions for the Kwintessence harmonic progression.
 *
 * Each difficulty level (beginner / intermediate / advanced) has its own set of
 * target notes, prompts, and hints:
 *
 *  - beginner:     All notes in octave 4 (MIDI 60-72). Verbose prompts, hint always
 *                  shown automatically, explicit MIDI number in hint text.
 *  - intermediate: Same target notes as beginner. Concise prompts, hint on request only.
 *  - advanced:     Notes spread across two octaves (3 and 5) for wider voicing.
 *                  Minimal prompts, no key-location hint (only interval name).
 */

const layersByDifficulty = {
  beginner: [
    {
      number: 1,
      name: "Foundation",
      prompt: "Let's start simple. Find and play middle C — the root note. It's the anchor every harmony is built on.",
      hint: "Middle C is the white key at the center of the keyboard, labeled C4 (MIDI 60). It's the leftmost C in our range.",
      explanation: "The root note is where harmonic understanding begins. Every other note in a chord or scale is measured in relation to this anchor. When you play C, you establish a centre of gravity — a home that all subsequent notes will either lean toward or pull away from.",
      targetMidi: 60,
      autoHint: true
    },
    {
      number: 2,
      name: "The Fifth",
      prompt: "Great! Now add the perfect fifth above C. This interval sounds open and stable — the natural partner of the root.",
      hint: "Count seven white and black keys up from C4. That's G4 (MIDI 67), a white key.",
      explanation: "The perfect fifth is the most consonant interval after the octave. Its two notes share so many overtones that they blend almost into one sound. This openness gives the fifth a universal quality — it appears at the core of virtually every musical tradition, making it a cornerstone of harmonic understanding.",
      targetMidi: 67,
      autoHint: true
    },
    {
      number: 3,
      name: "The Third",
      prompt: "Almost a chord! Add the major third above C. It gives your harmony a bright, happy character.",
      hint: "E4 is four semitones above C4 (MIDI 64). It's the white key just before the group of two black keys.",
      explanation: "Adding the major third transforms two notes into a full major triad — one of the most recognisable sounds in Western music. The third is what gives a chord its emotional colour: major thirds sound bright and optimistic, while minor thirds sound warmer and more introspective. Your harmonic understanding grows when you can hear this difference clearly.",
      targetMidi: 64,
      autoHint: true
    },
    {
      number: 4,
      name: "The Seventh",
      prompt: "Now add the major seventh. It lifts your chord into something richer and more sophisticated.",
      hint: "B4 is just one semitone below the upper C — it's the white key immediately to the left of C5 (MIDI 71).",
      explanation: "The major seventh sits just one semitone below the octave, creating a luminous tension that longs to resolve upward. Adding it to your triad creates a major seventh chord — a sound central to jazz, bossa nova, and modern harmony. It speaks of sophistication and yearning, expanding your harmonic palette significantly.",
      targetMidi: 71,
      autoHint: true
    },
    {
      number: 5,
      name: "The Secunde",
      prompt: "Add the secunde — the D above middle C. It extends your chord into a second voice, adding colour.",
      hint: "D4 is two semitones above middle C (MIDI 62). It's the white key immediately to the right of C4.",
      explanation: "The second degree of the scale (the secunde) adds a voice that fills the space between the root and the third. When stacked with the other notes, it creates extensions like the ninth chord. In harmonic understanding, learning to hear how neighbouring scale degrees colour a chord is an essential step toward more expressive playing.",
      targetMidi: 62,
      autoHint: true
    },
    {
      number: 6,
      name: "The Sixth",
      prompt: "Nearly there! Add the major sixth — A. It brings warmth and a touch of longing to the harmony.",
      hint: "A4 is nine semitones above C4 (MIDI 69). It's the white key between G4 and B4.",
      explanation: "The major sixth has a gentle, nostalgic quality. As an added note, it softens the brightness of the major chord and introduces a bittersweet complexity. The sixth also has a special relationship with the minor third — A is the relative minor root of C major — meaning your harmonic understanding deepens as you begin connecting major and minor worlds.",
      targetMidi: 69,
      autoHint: true
    },
    {
      number: 7,
      name: "Resolution",
      prompt: "One last note: C, one octave higher. Return to the root and complete your composition.",
      hint: "C5 is the C immediately above B4 (MIDI 72) — the rightmost key in our range.",
      explanation: "Returning to the root an octave higher completes the harmonic journey. The octave is the most perfect consonance — the same pitch class, doubled in frequency. Ending here gives the listener a sense of arrival and closure. This moment captures something fundamental to harmonic understanding: every musical journey begins and ends at home.",
      targetMidi: 72,
      autoHint: true
    }
  ],

  intermediate: [
    {
      number: 1,
      name: "Foundation",
      prompt: "Play the root note — C. This is the anchor of your entire harmony.",
      hint: "C4 is the white key labeled C in the middle of the keyboard (MIDI 60).",
      explanation: "The root establishes tonal centre. All harmonic understanding flows from this reference point — every interval, chord, and scale degree derives its identity relative to the root.",
      targetMidi: 60,
      autoHint: false
    },
    {
      number: 2,
      name: "The Fifth",
      prompt: "Add the perfect fifth — G. It creates openness and stability above the root.",
      hint: "G4 is a white key, seven semitones above C (MIDI 67).",
      explanation: "The perfect fifth (ratio 3:2) is the most consonant non-octave interval. It forms the structural backbone of tonal harmony and is present in every major and minor triad. Its openness makes it the default interval for power chords and open voicings.",
      targetMidi: 67,
      autoHint: false
    },
    {
      number: 3,
      name: "The Third",
      prompt: "Complete the triad by adding the third — E. This gives the chord its bright, optimistic character.",
      hint: "E4 is a white key, four semitones above C (MIDI 64).",
      explanation: "The major third (ratio 5:4) determines chord quality. A chord built on root + major third + perfect fifth is a major triad — the harmonic foundation of Western tonal music. A deepening harmonic understanding means hearing the emotional distinction between major and minor thirds immediately.",
      targetMidi: 64,
      autoHint: false
    },
    {
      number: 4,
      name: "The Seventh",
      prompt: "Add the major seventh — B. It brings sophistication and a luminous tension to the chord.",
      hint: "B4 is a white key, just one semitone below the upper C (MIDI 71).",
      explanation: "The major seventh creates Cmaj7, a chord that defines modern jazz and pop harmony. Unlike the dominant seventh (a minor seventh), the major seventh resolves inward with a sense of floating rather than driving forward — a subtlety central to harmonic understanding.",
      targetMidi: 71,
      autoHint: false
    },
    {
      number: 5,
      name: "The Secunde",
      prompt: "Add the secunde — D. The second degree of the scale, extending the harmony into a new voice.",
      hint: "D4 is a white key, two semitones above C (MIDI 62).",
      explanation: "The major second (nine-chord extension) fills the gap between root and third. As a diatonic step it's dissonant in close voicing but beautiful as an extension — the difference between Cmaj7 and Cmaj9. Harmonic understanding includes knowing when proximity creates tension and when spacing creates colour.",
      targetMidi: 62,
      autoHint: false
    },
    {
      number: 6,
      name: "The Sixth",
      prompt: "Add the major sixth — A. It brings warmth and a sense of longing to the harmony.",
      hint: "A4 is a white key, nine semitones above C (MIDI 69).",
      explanation: "The major sixth is the enharmonic relative of the minor third. Adding A to a C major chord creates C6 — a lush, nostalgic sound favoured in swing and bossa nova. Recognising the sixth as also being the root of the relative minor (Am) deepens your harmonic understanding of modal relationships.",
      targetMidi: 69,
      autoHint: false
    },
    {
      number: 7,
      name: "Resolution",
      prompt: "Return to the root — C, one octave higher. Anchor the harmony and complete your composition.",
      hint: "C5 is the rightmost C on the keyboard (MIDI 72).",
      explanation: "The octave is the perfect consonance — frequency ratio 2:1. Closing on the upper root reinforces the tonal centre and gives the listener the sense of harmonic resolution. This structural return embodies a key insight of harmonic understanding: tension and motion must ultimately give way to rest.",
      targetMidi: 72,
      autoHint: false
    }
  ],

  chords: [
    {
      number: 1,
      name: "Fifth+Third",
      prompt: "Play C and E together — the root with its major third.",
      hint: "Hold C4 (MIDI 60) and press E4 (MIDI 64) at the same time.",
      explanation: "Two notes are already a harmonic statement. Root + major third establishes major quality before the fifth is even present — your ear fills in the rest.",
      targetMidis: [60, 64],
      autoHint: false
    },
    {
      number: 2,
      name: "Root+Fifth",
      prompt: "Play C and G — the open fifth, the most stable interval.",
      hint: "Hold C4 (MIDI 60) and press G4 (MIDI 67).",
      explanation: "The power chord: harmonically ambiguous (neither major nor minor), but massively stable. The open fifth is the backbone of harmonic understanding across cultures.",
      targetMidis: [60, 67],
      autoHint: false
    },
    {
      number: 3,
      name: "Major Triad",
      prompt: "Play the full C major triad: C, E, and G.",
      hint: "Press C4 (60), E4 (64), and G4 (67) together.",
      explanation: "The major triad is the atom of Western tonal harmony. Root, third, and fifth together define the chord unambiguously. Harmonic understanding of triads underlies every more complex chord structure.",
      targetMidis: [60, 64, 67],
      autoHint: false
    },
    {
      number: 4,
      name: "Major 7th",
      prompt: "Add the major seventh B — the Cmaj7 chord.",
      hint: "Press C4 (60), E4 (64), G4 (67), and B4 (71).",
      explanation: "Cmaj7 retains the major triad's brightness while adding the seventh's luminous tension. The leading tone B floats just below the octave C. This chord epitomises the harmonic understanding behind jazz and contemporary harmony.",
      targetMidis: [60, 64, 67, 71],
      autoHint: false
    },
    {
      number: 5,
      name: "Cluster",
      prompt: "Play C, D, E — a tight cluster of the first three scale degrees.",
      hint: "Press C4 (60), D4 (62), and E4 (64).",
      explanation: "Close-position clusters create friction through adjacent semitones and whole tones. Rather than smoothness, they offer texture and colour — an advanced application of harmonic understanding where dissonance becomes expressive.",
      targetMidis: [60, 62, 64],
      autoHint: false
    },
    {
      number: 6,
      name: "Added Sixth",
      prompt: "Play C, E, A — root, third, and sixth, the C6 sound.",
      hint: "Press C4 (60), E4 (64), and A4 (69).",
      explanation: "The added sixth chord creates a warm, nostalgic sound that avoids the density of a seventh chord. A is also the root of Am — the relative minor — so this chord hints at modal ambiguity, a hallmark of sophisticated harmonic understanding.",
      targetMidis: [60, 64, 69],
      autoHint: false
    },
    {
      number: 7,
      name: "Full Voicing",
      prompt: "Play C, D, E, G, B — the complete Cmaj9 upper structure.",
      hint: "Press C4 (60), D4 (62), E4 (64), G4 (67), and B4 (71).",
      explanation: "Five-note extended voicings represent the full expression of harmonic understanding — every tension is present simultaneously, yet the chord retains clarity. This is the sound of complete harmonic arrival: complex, luminous, resolved.",
      targetMidis: [60, 62, 64, 67, 71],
      autoHint: false
    }
  ],

  advanced: [
    {
      number: 1,
      name: "Foundation",
      prompt: "Root — C3. Set the bass foundation.",
      hint: "Perfect unison with the bass root. C3 (MIDI 48).",
      explanation: "Setting the root in the bass register defines the harmonic centre with authority. Low-register roots provide maximum stability — the foundation upon which all upper-voice harmonic understanding rests.",
      targetMidi: 48,
      autoHint: false
    },
    {
      number: 2,
      name: "The Fifth",
      prompt: "Perfect fifth — G3. Open voicing below the treble range.",
      hint: "A fifth above C3 is G3 (MIDI 55).",
      explanation: "The bass fifth reinforces the root's harmonic gravity before the upper voices speak. This two-note open voicing exploits the acoustic power of low-register consonance — a technique that deepens harmonic understanding of voice leading and spacing.",
      targetMidi: 55,
      autoHint: false
    },
    {
      number: 3,
      name: "The Third",
      prompt: "Major third — E4. Bring in the colour an octave higher.",
      hint: "E4 (MIDI 64) — a tenth above the root.",
      explanation: "Introducing the third as a tenth (compound major third) instead of a simple third creates open-position voicing: harmonic clarity without muddiness. This interval choice demonstrates advanced harmonic understanding of register and spacing.",
      targetMidi: 64,
      autoHint: false
    },
    {
      number: 4,
      name: "The Seventh",
      prompt: "Major seventh — B4. Introduce the leading-tone tension.",
      hint: "B4 (MIDI 71) — major seventh above C4.",
      explanation: "The leading tone B4 creates the defining tension of the major seventh chord. At this register it shimmers above the texture without overpowering the bass. Placing this note requires precise harmonic understanding of interval function within a specific voicing context.",
      targetMidi: 71,
      autoHint: false
    },
    {
      number: 5,
      name: "The Secunde",
      prompt: "Secunde — D4. The second degree, in the tenor voice.",
      hint: "D4 (MIDI 62) — a secunde above C3.",
      explanation: "The ninth (D4) in the tenor completes the Cmaj9 structure. Placed inside the upper-voice texture it creates a rich inner voice that blends rather than leads. Understanding how inner voices support without dominating is a mark of mature harmonic understanding.",
      targetMidi: 62,
      autoHint: false
    },
    {
      number: 6,
      name: "The Sixth",
      prompt: "Major sixth — A4. The colour tone in the upper middle voice.",
      hint: "A4 (MIDI 69) — a major sixth above C4.",
      explanation: "The thirteenth (sixth) is the final colour-tone extension. As A4, it sits in the upper-middle register linking B4 above and D4 below. Hearing how this note bridges the seventh and ninth is the kind of fine-grained harmonic understanding that defines advanced compositional thinking.",
      targetMidi: 69,
      autoHint: false
    },
    {
      number: 7,
      name: "Resolution",
      prompt: "Resolution — C5. Close the upper voice back to the root.",
      hint: "C5 (MIDI 72) — the octave above middle C.",
      explanation: "The soprano C5 completes the architecture: root below, extensions in the middle, root above. This symmetrical structure embodies complete harmonic understanding — every tension has been named, every voice placed, and the circle is closed with the same pitch class that opened it.",
      targetMidi: 72,
      autoHint: false
    }
  ]
};

/**
 * Returns the puzzle layer definitions for the given difficulty.
 * Falls back to intermediate for any unrecognised value.
 * @param {string} difficulty  "beginner" | "intermediate" | "advanced"
 * @returns {Array}
 */
export function getPuzzleLayers(difficulty) {
  return layersByDifficulty[difficulty] ?? layersByDifficulty.intermediate;
}

/**
 * Returns true when the given MIDI note matches the target for the given layer and difficulty.
 * @param {number} layerNumber 1–7
 * @param {number} midi MIDI note number 0–127
 * @param {string} [difficulty] "beginner" | "intermediate" | "advanced"
 */
export function isCorrectNote(layerNumber, midi, difficulty = "intermediate") {
  const layers = getPuzzleLayers(difficulty);
  const layer = layers.find((l) => l.number === layerNumber);
  return layer?.targetMidi === midi;
}

/**
 * Returns true when the selected MIDI notes exactly match the target chord
 * for the given layer and difficulty (order-independent).
 * @param {number} layerNumber 1–7
 * @param {number[]} selectedMidis Array of selected MIDI note numbers
 * @param {string} [difficulty] "beginner" | "intermediate" | "advanced"
 */
export function isCorrectChord(layerNumber, selectedMidis, difficulty = "intermediate") {
  const layers = getPuzzleLayers(difficulty);
  const layer = layers.find((l) => l.number === layerNumber);
  if (!layer?.targetMidis) return false;
  if (selectedMidis.length !== layer.targetMidis.length) return false;
  const sorted = [...selectedMidis].sort((a, b) => a - b);
  const target = [...layer.targetMidis].sort((a, b) => a - b);
  return sorted.every((midi, i) => midi === target[i]);
}

/**
 * Returns a new array of layers with each layer's targetMidi offset by
 * (rootMidi - 60), so the puzzle is transposed to the given root note.
 * Prompts, hints, and explanations are also rewritten with transposed note names.
 * Does not mutate the input array or its objects.
 * @param {Array} layers  Layer objects (each with a targetMidi property)
 * @param {number} rootMidi  MIDI note number of the desired root (60 = C)
 * @returns {Array}
 */

const _NOTE_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const _NOTE_FLATS  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
// Root indices that conventionally use flats: Db(1), Eb(3), F(5), Ab(8), Bb(10)
const _FLAT_ROOT_INDICES = new Set([1, 3, 5, 8, 10]);

function _noteIdx(name) {
  const i = _NOTE_SHARPS.indexOf(name);
  return i !== -1 ? i : _NOTE_FLATS.indexOf(name);
}

/**
 * Replaces note names (e.g. "C", "G4", "Cmaj7", "Am") in a string with their
 * equivalents after shifting by the given number of semitones.
 */
function transposeText(text, semitones) {
  if (!text || semitones === 0) return text;
  const rootChromatic = ((semitones % 12) + 12) % 12;
  const outNames = _FLAT_ROOT_INDICES.has(rootChromatic) ? _NOTE_FLATS : _NOTE_SHARPS;
  return text.replace(
    /\b([A-G][b#]?)(maj\d*|min\d*|m(?!\w)|aug|dim|sus\d*|add\d*|\d|)\b/g,
    (match, notePart, suffix) => {
      const idx = _noteIdx(notePart);
      if (idx === -1) return match;
      const raw = idx + semitones;
      const newNote = outNames[((raw % 12) + 12) % 12];
      // Adjust octave digit when the note wraps across an octave boundary
      if (suffix && /^\d$/.test(suffix)) {
        return `${newNote}${parseInt(suffix, 10) + Math.floor(raw / 12)}`;
      }
      return newNote + suffix;
    }
  );
}

export function transposeLayers(layers, rootMidi) {
  const offset = rootMidi - 60;
  if (offset === 0) return layers;
  return layers.map((layer) => ({
    ...layer,
    targetMidi: layer.targetMidi !== undefined ? layer.targetMidi + offset : undefined,
    ...(layer.targetMidis ? { targetMidis: layer.targetMidis.map((m) => m + offset) } : {}),
    prompt:      transposeText(layer.prompt, offset),
    hint:        transposeText(layer.hint, offset),
    explanation: transposeText(layer.explanation, offset)
  }));
}

/**
 * Returns the layerNumber of the first incomplete layer in the composition,
 * or null when all layers are complete.
 * @param {object} composition API composition response
 * @param {string} [difficulty] "beginner" | "intermediate" | "advanced"
 */
export function getFirstIncompleteLayer(composition, difficulty = "intermediate") {
  const layers = getPuzzleLayers(difficulty);
  for (const puzzleLayer of layers) {
    const apiLayer = composition.layers.find((l) => l.layerNumber === puzzleLayer.number);
    if (!apiLayer?.completed) {
      return puzzleLayer.number;
    }
  }

  return null;
}

/**
 * Returns 4 multiple-choice options for movement-3 puzzles.
 * One option is correct; the other 3 are the nearest distinct candidates
 * from the intermediate layer pool (transposed to rootMidi).
 *
 * Each option: { label: string, midi: number, isCorrect: boolean }
 *
 * @param {number} layerNumber 1–7
 * @param {number} rootMidi    MIDI root (60 = C)
 * @returns {{ label: string, midi: number, isCorrect: boolean }[]}
 */
export function getMultipleChoiceOptions(layerNumber, rootMidi = 60) {
  const NOTE_NAMES = ['C', 'C#/D♭', 'D', 'D#/E♭', 'E', 'F', 'F#/G♭', 'G', 'G#/A♭', 'A', 'A#/B♭', 'B'];
  const OCTAVE_LABELS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

  function midiLabel(midi) {
    const pc = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    return `${OCTAVE_LABELS[pc]}${octave}`;
  }

  // All 7 transposed intermediate targets — these form the candidate pool
  const baseLayers = transposeLayers(layersByDifficulty.intermediate, rootMidi);
  const correctLayer = baseLayers.find((l) => l.number === layerNumber);
  const correctMidi = correctLayer?.targetMidi ?? 60;

  // Candidates: all other target MIDIs
  const candidates = baseLayers
    .filter((l) => l.number !== layerNumber)
    .map((l) => l.targetMidi)
    .sort((a, b) => Math.abs(a - correctMidi) - Math.abs(b - correctMidi));

  // Pick the 3 closest distractors
  const distractors = candidates.slice(0, 3);

  const options = [
    { label: midiLabel(correctMidi), midi: correctMidi, isCorrect: true },
    ...distractors.map((m) => ({ label: midiLabel(m), midi: m, isCorrect: false }))
  ];

  // Fisher-Yates shuffle for random positioning
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return options;
}
