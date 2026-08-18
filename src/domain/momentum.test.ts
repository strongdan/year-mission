import { describe, it, expect } from "vitest";
import { dayScore, computeMomentum, momentumLabel } from "./momentum";

function day(overrides: Partial<Parameters<typeof dayScore>[0]> = {}) {
  return {
    date: "2026-08-01",
    bigFourCompleted: 4,
    meaningfulTasksCompleted: 5,
    minimumDayMet: true,
    ...overrides,
  };
}

describe("dayScore", () => {
  it("a perfect day scores 100", () => {
    expect(dayScore(day())).toBe(100);
  });

  it("caps the tasks contribution at 5", () => {
    expect(dayScore(day({ meaningfulTasksCompleted: 100 }))).toBe(100);
  });

  it("an empty day scores 0", () => {
    expect(dayScore(day({ bigFourCompleted: 0, meaningfulTasksCompleted: 0, minimumDayMet: false }))).toBe(0);
  });

  it("a single missed day does not zero the score", () => {
    const good = day();
    const bad = day({ bigFourCompleted: 0, meaningfulTasksCompleted: 0, minimumDayMet: false });
    const momentum = computeMomentum({ days: [good, good, good, good, good, good, bad, good] });
    expect(momentum).toBeGreaterThan(70);
  });
});

describe("computeMomentum", () => {
  it("returns null with no data", () => {
    expect(computeMomentum({ days: [] })).toBeNull();
  });

  it("recovers quickly after disruption", () => {
    const good = day();
    const bad = day({ bigFourCompleted: 0, meaningfulTasksCompleted: 0, minimumDayMet: false });
    const afterDisruption = computeMomentum({ days: [good, good, good, good, bad, good, good, good, good] });
    const longAgoDisruption = computeMomentum({ days: [bad, good, good, good, good, good, good, good, good] });
    expect(longAgoDisruption!).toBeGreaterThan(afterDisruption!);
  });

  it("never drops to zero from a single bad day", () => {
    const momentum = computeMomentum({ days: [day(), day(), day({ bigFourCompleted: 0, meaningfulTasksCompleted: 0, minimumDayMet: false })] });
    expect(momentum!).toBeGreaterThan(0);
  });
});

describe("momentumLabel", () => {
  it("labels the ranges", () => {
    expect(momentumLabel(null)).toBe("No data yet");
    expect(momentumLabel(80)).toBe("Strong");
    expect(momentumLabel(60)).toBe("Steady");
    expect(momentumLabel(30)).toBe("Rebuilding");
    expect(momentumLabel(10)).toBe("Starting");
  });
});