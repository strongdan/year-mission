import { describe, it, expect } from "vitest";
import { computeCategoryMomentum, dayScore, computeMomentum, momentumLabel } from "./momentum";

function day(overrides: Partial<Parameters<typeof dayScore>[0]> = {}) {
  return {
    date: "2026-08-01",
    bigFourCompleted: 4,
    meaningfulTasksCompleted: 5,
    minimumDayMet: true,
    ...overrides,
  };
}

const weeklyTargets = { body: 2, money: 1, home: 1, capability: 1 } as const;

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

describe("computeCategoryMomentum", () => {
  it("shows no scores until there is meaningful activity to compare", () => {
    const result = computeCategoryMomentum({
      recentUnits: { body: 0, money: 0, home: 0, capability: 0 },
      previousUnits: { body: 0, money: 0, home: 0, capability: 0 },
      weeklyTargets,
    });

    expect(result).toHaveLength(4);
    expect(result.every((item) => item.score === null && item.relative === null)).toBe(true);
  });

  it("weights the rolling current week more than the prior week without resetting", () => {
    const result = computeCategoryMomentum({
      recentUnits: { body: 2, money: 0, home: 0, capability: 0 },
      previousUnits: { body: 0, money: 1, home: 0, capability: 0 },
      weeklyTargets,
    });

    const body = result.find((item) => item.slug === "body")!;
    const money = result.find((item) => item.slug === "money")!;
    expect(body.score).toBe(72);
    expect(body.trend).toBe("rising");
    expect(money.score).toBe(28);
    expect(money.trend).toBe("quieter");
    expect(money.score).toBeGreaterThan(0);
  });

  it("compares each category against the user's own four-category average", () => {
    const result = computeCategoryMomentum({
      recentUnits: { body: 2, money: 0, home: 1, capability: 0.5 },
      previousUnits: { body: 2, money: 1, home: 1, capability: 0.5 },
      weeklyTargets,
    });

    const home = result.find((item) => item.slug === "home")!;
    const money = result.find((item) => item.slug === "money")!;
    expect(home.score).toBe(100);
    expect(home.relative).toBe("leading");
    expect(home.deltaFromAverage).toBeGreaterThan(0);
    expect(money.relative).toBe("quieter");
    expect(money.deltaFromAverage).toBeLessThan(0);
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
