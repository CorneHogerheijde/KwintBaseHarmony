import { midiStatus } from "./dom.js";
import { midiToLabel } from "./music.js";

export async function setupMidiInput(onNote, log) {
  if (!("requestMIDIAccess" in navigator)) {
    midiStatus.textContent = "Web MIDI unavailable in this browser";
    return;
  }

  try {
    const midiAccess = await navigator.requestMIDIAccess();

    const bindInputs = () => {
      const inputs = Array.from(midiAccess.inputs.values());
      midiStatus.textContent = inputs.length === 0
        ? "MIDI ready, connect a keyboard to play notes"
        : `MIDI input ready: ${inputs[0].name}${inputs.length > 1 ? ` +${inputs.length - 1} more` : ""}`;

      for (const input of inputs) {
        input.onmidimessage = (event) => {
          const [status, note, velocity] = event.data;
          const command = status & 0xf0;

          if (command === 0x90 && velocity > 0) {
            onNote(note);
            log("Received MIDI note input", {
              midi: note,
              note: midiToLabel(note),
              device: input.name ?? "MIDI device"
            });
          }
        };
      }
    };

    bindInputs();
    midiAccess.onstatechange = bindInputs;
  } catch (error) {
    midiStatus.textContent = "MIDI permission denied or unavailable";
    log("Failed to initialize MIDI input", { error: error.message });
  }
}