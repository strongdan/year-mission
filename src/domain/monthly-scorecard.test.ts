import { describe, expect, it } from "vitest";
import { summarizeMonthlyActivity } from "./monthly-scorecard";

describe("monthly scorecard", () => {
  it("ignores meta-work and combines task, workout, and evidence activity", () => {
    const summary = summarizeMonthlyActivity({
      completedTasks: [
        { domainSlug: "money", weeklyWin: true },
        { domainSlug: "capability", courageTask: true },
        { domainSlug: "home", metaWork: true },
      ],
      workouts: 3,
      evidenceByDomain: { money: 1, home: 1 },
    });

    expect(summary.meaningfulTasks).toBe(2);
    expect(summary.weeklyWins).toBe(1);
    expect(summary.courageTasks).toBe(1);
    expect(summary.domainCounts).toEqual({ money: 2, body: 3, home: 1, capability: 1 });
    expect(summary.strongestDomain).toBe("body");
  });

  it("recommends protecting a domain that disappeared entirely", () => {
    const summary = summarizeMonthlyActivity({
      completedTasks: [{ domainSlug: "capability" }],
      workouts: 0,
    });

    expect(summary.domainCounts.money).toBe(0);
    expect(summary.recommendation).toContain("Protect one");
  });
});
