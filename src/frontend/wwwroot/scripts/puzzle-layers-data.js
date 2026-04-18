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

// Jazz style overrides: layer 4 uses B♭4 (MIDI 70, dominant seventh) instead of B4 (71).
// All other layers are identical to classical.
const layersByDifficulty_jazz = {
  beginner: layersByDifficulty.beginner.map((layer) => {
    if (layer.number === 4) {
      return {
        ...layer,
        name: "The Dominant Seventh",
        prompt: "Add the dominant seventh — B♭. This flatted seventh is the defining colour of jazz harmony.",
        hint: "B♭4 is one semitone below B4 (MIDI 70). It's the black key just before B.",
        explanation: "The dominant seventh transforms a major chord into a dominant seventh chord (C7). This flatted note creates a tension that wants to resolve — jazz exploits this tension endlessly, delaying or sidestepping it to create momentum and colour.",
        targetMidi: 70
      };
    }
    return layer;
  }),
  intermediate: layersByDifficulty.intermediate.map((layer) => {
    if (layer.number === 4) {
      return {
        ...layer,
        name: "The Dominant Seventh",
        prompt: "Add the dominant seventh — B♭. The flatted seventh is jazz's signature sound.",
        hint: "B♭4 is a black key, one semitone below B4 (MIDI 70).",
        explanation: "The dominant seventh (minor seventh interval) gives jazz its characteristic blend of brightness and yearning. Unlike the major seventh, it pushes forward rather than floating — the engine of jazz harmonic movement.",
        targetMidi: 70
      };
    }
    return layer;
  }),
  advanced: layersByDifficulty.advanced.map((layer) => {
    if (layer.number === 4) {
      return {
        ...layer,
        name: "The Dominant Seventh",
        prompt: "Dominant seventh — B♭4. The flatted leading tone that defines the jazz dominant.",
        hint: "B♭4 (MIDI 70) — minor seventh above C4.",
        explanation: "The minor seventh placed in this register creates the jazz dominant voicing. Unlike the major seventh's upward float, the dominant seventh presses down — a subtle but harmonically decisive difference that advanced harmonic understanding demands you hear.",
        targetMidi: 70
      };
    }
    return layer;
  }),
  chords: layersByDifficulty.chords
};

// Blues style overrides:
//   Layer 3: E♭4 (MIDI 63, minor third — the blues minor/major ambiguity)
//   Layer 4: B♭4 (MIDI 70, flat seven — dominant seventh like jazz)
//   Layer 5: G♭4 (MIDI 66, tritone / blue note)
const layersByDifficulty_blues = {
  beginner: layersByDifficulty.beginner.map((layer) => {
    if (layer.number === 3) {
      return {
        ...layer,
        name: "The Blue Third",
        prompt: "Add E♭ — the minor third. The blues lives in the space between major and minor.",
        hint: "E♭4 is one semitone below E4 (MIDI 63). It's the black key just before E.",
        explanation: "The minor third over a major root is the heart of the blues sound — technically 'wrong' in classical major harmony, but expressively right. This tension between E♭ and the underlying C major is what gives the blues its emotional complexity.",
        targetMidi: 63
      };
    }
    if (layer.number === 4) {
      return {
        ...layer,
        name: "The Flat Seven",
        prompt: "Add B♭ — the flat seven. Another blue note that shifts the harmony toward the dominant.",
        hint: "B♭4 is one semitone below B4 (MIDI 70). It's the black key just before B.",
        explanation: "The dominant seventh (B♭) stacked over the root and minor third creates the characteristic blues chord sound. This chord appears on every degree of the blues progression, a hallmark of the style.",
        targetMidi: 70
      };
    }
    if (layer.number === 5) {
      return {
        ...layer,
        name: "The Blue Note",
        prompt: "Add G♭ — the tritone, the most dissonant interval and the ultimate blue note.",
        hint: "G♭4 is six semitones above C4 (MIDI 66). It's a black key between F# and G.",
        explanation: "The tritone (augmented fourth / diminished fifth) is the most dissonant interval in Western music — the 'diabolus in musica'. In the blues, it's embraced as the b5 blue note, a deliberate clash that expresses the emotional tension central to the style.",
        targetMidi: 66
      };
    }
    return layer;
  }),
  intermediate: layersByDifficulty.intermediate.map((layer) => {
    if (layer.number === 3) {
      return {
        ...layer,
        name: "The Blue Third",
        prompt: "Add E♭ — the minor third that gives blues its characteristic clash.",
        hint: "E♭4 is a black key, one semitone below E4 (MIDI 63).",
        explanation: "The blue minor third creates the tonal ambiguity that defines blues tonality — simultaneously suggesting major (the root) and minor (E♭). This unresolved tension is the essence of blues harmonic understanding.",
        targetMidi: 63
      };
    }
    if (layer.number === 4) {
      return {
        ...layer,
        name: "The Flat Seven",
        prompt: "Add B♭ — the dominant seventh, the other core blues note.",
        hint: "B♭4 is a black key, one semitone below B4 (MIDI 70).",
        explanation: "The dominant seventh is as essential to blues as to jazz, but in blues context it appears on every chord of the progression — not just the dominant. This non-functional use of dominant sevenths is a defining feature of blues harmonic understanding.",
        targetMidi: 70
      };
    }
    if (layer.number === 5) {
      return {
        ...layer,
        name: "The Blue Note",
        prompt: "Add G♭ — the tritone blue note, the most dissonant and expressive sound in the blues.",
        hint: "G♭4 is a black key, six semitones above C (MIDI 66).",
        explanation: "The b5 (tritone) occupies the exact halfway point of the octave — maximally dissonant, maximally tense. In the blues it's deployed as a passing note or bend target that evokes the style's raw emotional power. True blues harmonic understanding means hearing it as an expressive choice, not an error.",
        targetMidi: 66
      };
    }
    return layer;
  }),
  advanced: layersByDifficulty.advanced.map((layer) => {
    if (layer.number === 3) {
      return {
        ...layer,
        name: "The Blue Third",
        prompt: "Minor third — E♭4. The ambiguous tonal clash that defines the blues sound.",
        hint: "E♭4 (MIDI 63) — minor third above C4.",
        explanation: "Introducing the minor third against a major root in the tenor register creates the blues harmonic collision at its most intimate. This inner-voice dissonance sits beneath the dominant seventh and above the bass, creating layered tension that advanced blues understanding demands you voice precisely.",
        targetMidi: 63
      };
    }
    if (layer.number === 4) {
      return {
        ...layer,
        name: "The Flat Seven",
        prompt: "Dominant seventh — B♭4. The flat seven above, completing the blues dominant sound.",
        hint: "B♭4 (MIDI 70) — minor seventh above C4.",
        explanation: "Set against E♭4 below, B♭4 creates a diminished fifth — a powerful internal dissonance within the chord. This interval (E♭–B♭) is the engine of blues harmonic tension at the advanced level, where every interval placement is a deliberate expressive choice.",
        targetMidi: 70
      };
    }
    if (layer.number === 5) {
      return {
        ...layer,
        name: "The Blue Note",
        prompt: "Tritone — G♭4. The most dissonant note in the blues palette.",
        hint: "G♭4 (MIDI 66) — diminished fifth above C4.",
        explanation: "Placing the tritone in the same register as E♭ and B♭ creates a cluster of maximum dissonance. At this level, blues harmonic understanding means recognising that these clashes are not mistakes but deliberate architecture — the blues aesthetic expressed in full advanced voicing.",
        targetMidi: 66
      };
    }
    return layer;
  }),
  chords: layersByDifficulty.chords
};

const _styleLayerTables = {
  classical: layersByDifficulty,
  jazz: layersByDifficulty_jazz,
  blues: layersByDifficulty_blues
};

/**
 * Returns the puzzle layer definitions for the given difficulty and style.
 * Falls back to intermediate difficulty and classical style for unrecognised values.
 * @param {string} difficulty  "beginner" | "intermediate" | "advanced"
 * @param {string} [style]     "classical" | "jazz" | "blues"
 * @returns {Array}
 */
export function getPuzzleLayers(difficulty, style = 'classical') {
  const table = _styleLayerTables[style] ?? _styleLayerTables.classical;
  return table[difficulty] ?? table.intermediate;
}
