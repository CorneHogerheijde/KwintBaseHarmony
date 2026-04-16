import { describe, it, expect } from "vitest";
import { renderCircleOfFifths } from "../../wwwroot/scripts/circle-of-fifths.js";

function makeContainer() {
  return { innerHTML: "" };
}

describe("renderCircleOfFifths", () => {
  it("renders an SVG element", () => {
    const el = makeContainer();
    renderCircleOfFifths(el, 60);
    expect(el.innerHTML).toContain("<svg");
  });

  it("labels the target note in the aria-label", () => {
    const el = makeContainer();
    renderCircleOfFifths(el, 60); // C
    expect(el.innerHTML).toContain("C highlighted");
  });

  it("applies cof-target-pulse class to the target node", () => {
    const el = makeContainer();
    renderCircleOfFifths(el, 64); // E (not root)
    expect(el.innerHTML).toContain('class="cof-target-pulse"');
  });

  it("renders the inner minor ring", () => {
    const el = makeContainer();
    renderCircleOfFifths(el, 60);
    expect(el.innerHTML).toContain("Am");
    expect(el.innerHTML).toContain("Em");
  });

  it("highlights completed nodes with green stroke when completedMidis provided", () => {
    const el = makeContainer();
    renderCircleOfFifths(el, 64, 60, [67]);
    expect(el.innerHTML).toContain("#6fcf97");
  });

  it("does not render green stroke when completedMidis is empty", () => {
    const el = makeContainer();
    renderCircleOfFifths(el, 64, 60, []);
    expect(el.innerHTML).not.toContain("#6fcf97");
  });

  it("defaults completedMidis to empty (no green stroke)", () => {
    const el = makeContainer();
    renderCircleOfFifths(el, 64, 60);
    expect(el.innerHTML).not.toContain("#6fcf97");
  });

  it("handles multiple completed non-root non-target MIDI notes", () => {
    const el = makeContainer();
    renderCircleOfFifths(el, 71, 60, [67, 62]);
    const matches = (el.innerHTML.match(/#6fcf97/g) || []).length;
    expect(matches).toBeGreaterThanOrEqual(2);
  });

  it("uses pitch class (mod 12) for completed note matching", () => {
    const el = makeContainer();
    renderCircleOfFifths(el, 64, 60, [79]); // 79 % 12 === 7 === G
    expect(el.innerHTML).toContain("#6fcf97");
  });
});
