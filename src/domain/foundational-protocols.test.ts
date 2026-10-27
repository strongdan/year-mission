import { describe, expect, it } from "vitest";
import { FOUNDATION_PROTOCOLS, foundationCueForHour } from "./foundational-protocols";

describe("foundational protocols", () => {
  it("keeps the default protocol set small and runnable", () => {
    expect(Object.keys(FOUNDATION_PROTOCOLS)).toEqual([
      "morning-outdoor-light",
      "calm-breathing",
      "post-meal-walk",
    ]);

    for (const protocol of Object.values(FOUNDATION_PROTOCOLS)) {
      expect(protocol.estimatedMinutes).toBeGreaterThan(0);
      expect(protocol.sourceUrl).toMatch(/^https:\/\//);
      expect(protocol.steps.length).toBeGreaterThan(0);
      expect(protocol.steps.every((step) => step.durationSeconds > 0)).toBe(true);
    }
  });

  it("uses a daylight cue in the morning", () => {
    expect(foundationCueForHour(7)).toMatchObject({
      id: "morning-light",
      href: "/execute/morning-outdoor-light",
    });
  });

  it("uses a walking cue during the day", () => {
    expect(foundationCueForHour(13)).toMatchObject({
      id: "day-walk",
      href: "/execute/post-meal-walk",
    });
  });

  it("uses the existing evening reset at night", () => {
    expect(foundationCueForHour(21)).toMatchObject({
      id: "evening-downshift",
      href: "/execute/evening-reset",
    });
  });

  it("clamps out-of-range hours instead of inventing a new state", () => {
    expect(foundationCueForHour(-8).id).toBe("morning-light");
    expect(foundationCueForHour(99).id).toBe("evening-downshift");
  });
});
