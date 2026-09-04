import { describe, expect, it } from "vitest";
import { buildChargeState, chooseBonusMission, detectComeback, taskChargePoints } from "./game-loop";

const baseTask = {
  impact: "low" as const,
  courage_task: false,
  weekly_win: false,
  meta_work: false,
};

const bigFour = {
  body: { done: 1, target: 2 },
  money: { done: 0, target: 1 },
  home: { done: 1, target: 1 },
  capability: { done: 0, target: 2 },
};

describe("taskChargePoints", () => {
  it("does not reward meta-work", () => {
    expect(taskChargePoints({ ...baseTask, meta_work: true })).toBe(0);
  });

  it("rewards impact, courage, and weekly-win importance", () => {
    expect(taskChargePoints(baseTask)).toBe(18);
    expect(taskChargePoints({ ...baseTask, impact: "high", courage_task: true, weekly_win: true })).toBe(50);
  });
});

describe("buildChargeState", () => {
  it("combines meaningful action with protected-area progress", () => {
    const state = buildChargeState({ completedToday: [baseTask], bigFour });
    expect(state.charge).toBe(23);
    expect(state.label).toBe("Ignited");
    expect(state.meaningfulActions).toBe(1);
    expect(state.protectedAreas).toBe(1);
    expect(state.nextTarget).toBe(50);
  });

  it("does not passively charge from weekly protection without action today", () => {
    const state = buildChargeState({ completedToday: [], bigFour });
    expect(state.charge).toBe(0);
    expect(state.label).toBe("Ready");
    expect(state.protectedAreas).toBe(1);
  });

  it("caps daily charge at 100", () => {
    const completedToday = Array.from({ length: 4 }, () => ({ ...baseTask, impact: "high" as const, courage_task: true, weekly_win: true }));
    const protected = Object.fromEntries(Object.keys(bigFour).map((key) => [key, { done: 1, target: 1 }]));
    const state = buildChargeState({ completedToday, bigFour: protected });
    expect(state.charge).toBe(100);
    expect(state.label).toBe("Full charge");
    expect(state.nextTarget).toBeNull();
  });
});

describe("chooseBonusMission", () => {
  it("chooses the least-protected open domain", () => {
    expect(chooseBonusMission(bigFour)).toEqual({ slug: "money", label: "Money", done: 0, target: 1 });
  });

  it("returns null when all areas are protected", () => {
    expect(chooseBonusMission({
      body: { done: 1, target: 1 },
      money: { done: 1, target: 1 },
      home: { done: 1, target: 1 },
      capability: { done: 1, target: 1 },
    })).toBeNull();
  });
});

describe("detectComeback", () => {
  it("recognizes a return after quiet days", () => {
    expect(detectComeback({
      today: "2026-09-04",
      meaningfulActionsToday: 1,
      recentMeaningfulCompletionDates: ["2026-09-04", "2026-09-01", "2026-08-31"],
    })).toEqual({ active: true, quietDays: 2 });
  });

  it("does not invent a comeback on consecutive active days", () => {
    expect(detectComeback({
      today: "2026-09-04",
      meaningfulActionsToday: 1,
      recentMeaningfulCompletionDates: ["2026-09-04", "2026-09-03"],
    })).toEqual({ active: false, quietDays: 0 });
  });

  it("requires meaningful action today", () => {
    expect(detectComeback({
      today: "2026-09-04",
      meaningfulActionsToday: 0,
      recentMeaningfulCompletionDates: ["2026-09-01"],
    })).toEqual({ active: false, quietDays: 0 });
  });
});
