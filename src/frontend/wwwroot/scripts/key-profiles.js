/**
 * Key profiles for all supported major keys in the circle of fifths.
 *
 * rootMidi uses octave 4 as the reference (C4 = MIDI 60).
 * Accidentals are listed in the order they appear in a standard key signature.
 *
 * Sharp order:  F♯ → C♯ → G♯ → D♯ → A♯ → E♯
 * Flat order:   B♭ → E♭ → A♭ → D♭ → G♭ → C♭
 *
 * Staff diatonic positions for key signature rendering (treble clef, bottomLineIndex = 30):
 *   Sharps: F5(38), C5(35), G5(39), D5(36), A4(33), E5(37), B4(34)
 *   Flats:  B4(34), E5(37), A4(33), D5(36), G4(32), C5(35), F5(38)
 *
 * Staff diatonic positions for key signature rendering (bass clef, bottomLineIndex = 18):
 *   Sharps: F3(24), C3(21), G3(25), D3(22), A2(19), E3(23), B2(20)
 *   Flats:  B2(20), E3(23), A2(19), D3(22), G2(18), C3(21), F3(24)
 */

export const KEY_PROFILES = [
  // Centre — no accidentals
  {
    rootMidi: 60,
    name: "C major",
    label: "C major — no accidentals",
    accidentals: [],
    accidentalType: "none"
  },
  // Sharp keys (clockwise around the circle of fifths)
  {
    rootMidi: 67,
    name: "G major",
    label: "G major — 1♯ (F♯)",
    accidentals: ["F♯"],
    accidentalType: "sharp"
  },
  {
    rootMidi: 62,
    name: "D major",
    label: "D major — 2♯ (F♯ C♯)",
    accidentals: ["F♯", "C♯"],
    accidentalType: "sharp"
  },
  {
    rootMidi: 69,
    name: "A major",
    label: "A major — 3♯ (F♯ C♯ G♯)",
    accidentals: ["F♯", "C♯", "G♯"],
    accidentalType: "sharp"
  },
  {
    rootMidi: 64,
    name: "E major",
    label: "E major — 4♯ (F♯ C♯ G♯ D♯)",
    accidentals: ["F♯", "C♯", "G♯", "D♯"],
    accidentalType: "sharp"
  },
  // Flat keys (counter-clockwise around the circle of fifths)
  {
    rootMidi: 65,
    name: "F major",
    label: "F major — 1♭ (B♭)",
    accidentals: ["B♭"],
    accidentalType: "flat"
  },
  {
    rootMidi: 70,
    name: "B♭ major",
    label: "B♭ major — 2♭ (B♭ E♭)",
    accidentals: ["B♭", "E♭"],
    accidentalType: "flat"
  },
  {
    rootMidi: 63,
    name: "E♭ major",
    label: "E♭ major — 3♭ (B♭ E♭ A♭)",
    accidentals: ["B♭", "E♭", "A♭"],
    accidentalType: "flat"
  },
  {
    rootMidi: 68,
    name: "A♭ major",
    label: "A♭ major — 4♭ (B♭ E♭ A♭ D♭)",
    accidentals: ["B♭", "E♭", "A♭", "D♭"],
    accidentalType: "flat"
  }
];

/**
 * Diatonic staff positions for each accidental in a key signature.
 * Values are diatonicIndex integers (octave * 7 + diatonicSteps[letter]).
 * Indexed by clef ("treble" | "bass") and accidentalType ("sharp" | "flat").
 */
export const KEY_SIG_DIATONIC = {
  treble: {
    sharp: [38, 35, 39, 36, 33, 37, 34], // F5 C5 G5 D5 A4 E5 B4
    flat:  [34, 37, 33, 36, 32, 35, 38]  // B4 E5 A4 D5 G4 C5 F5
  },
  bass: {
    sharp: [24, 21, 25, 22, 19, 23, 20], // F3 C3 G3 D3 A2 E3 B2
    flat:  [20, 23, 19, 22, 18, 21, 24]  // B2 E3 A2 D3 G2 C3 F3
  }
};

/**
 * Returns the key profile for a given rootMidi.
 * Falls back to C major if the rootMidi is not in the supported key list.
 * @param {number} rootMidi
 * @returns {{ rootMidi: number, name: string, label: string, accidentals: string[], accidentalType: string }}
 */
export function getKeyProfile(rootMidi) {
  return KEY_PROFILES.find((k) => k.rootMidi === rootMidi) ?? KEY_PROFILES[0];
}

/**
 * Recommended key learning sequence for educator-guided progression.
 * Starts at C (no accidentals), walks clockwise through sharp keys (G, D, A, E),
 * then counter-clockwise through flat keys (F, B♭, E♭, A♭).
 * These rootMidi values correspond to the order listed in KEY_PROFILES.
 */
export const KEY_JOURNEY = [60, 67, 62, 69, 64, 65, 70, 63, 68];

/**
 * Returns the rootMidi of the next key in the educator journey, or null if already at the end.
 * @param {number} rootMidi
 * @returns {number|null}
 */
export function getNextKey(rootMidi) {
  const idx = KEY_JOURNEY.indexOf(rootMidi);
  if (idx === -1 || idx === KEY_JOURNEY.length - 1) return null;
  return KEY_JOURNEY[idx + 1];
}

/**
 * Returns a plain-English theory explanation for the given key profile,
 * describing its position on the circle of fifths and its accidentals.
 * @param {number} rootMidi
 * @returns {string}
 */
export function getKeyTheory(rootMidi) {
  const profile = getKeyProfile(rootMidi);

  if (profile.accidentalType === "none") {
    return "C major is the tonal home of Western music — no sharps or flats, all white keys. Every other key is measured as a distance from C on the circle of fifths.";
  }

  const steps = profile.accidentals.length;
  const stepsWord = steps === 1 ? "1 step" : `${steps} steps`;
  const direction = profile.accidentalType === "sharp" ? "clockwise" : "counter-clockwise";
  const accType = profile.accidentalType === "sharp" ? "sharp" : "flat";
  const accList = profile.accidentals.join(", ");

  let mnemonic;
  if (profile.accidentalType === "sharp") {
    const lastSharp = profile.accidentals[profile.accidentals.length - 1];
    const keyName = profile.name.split(" ")[0];
    mnemonic = `The last sharp (${lastSharp}) is one half-step below the key name (${keyName}).`;
  } else if (steps >= 2) {
    const penultimateFlatKey = profile.accidentals[steps - 2];
    mnemonic = `The second-to-last flat (${penultimateFlatKey}) names the key.`;
  } else {
    mnemonic = "With only one flat (B♭), the key is F major — learnt by convention.";
  }

  return `${profile.name} is ${stepsWord} ${direction} from C on the circle of fifths. ` +
    `It has ${steps} ${accType}${steps > 1 ? "s" : ""}: ${accList}. ` +
    `${mnemonic} ` +
    `When you see ${steps} ${accType}${steps > 1 ? "s" : ""} in a key signature, you are in ${profile.name}.`;
}
