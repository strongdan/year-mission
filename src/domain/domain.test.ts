import { describe, it, expect } from "vitest";
import { canAddToToday, canAddToWeek, canAddCourageTask, canActivateExperiment, WIP_LIMITS } from "./wip";
import { canTransition, transitionTask, validTransitions } from "./task-states";
import { deferralIntervention, DEFERRAL_ACTION_MAP } from "./deferral";
import { assertActiveExperimentLimit, canTransitionExperiment, resolveExperimentStatus } from "./experiments";
import { isMetaWork, metaWorkExcludedFromMomentum } from "./meta-work";
import { taskWeight } from "./task-weight";
import { hasSufficientSample, supportsRateInsight, cautiousPhrase } from "./insights";

describe("WIP limits", () => {
  it("allows up to the today maximum then blocks", () => {
    expect(canAddToToday(4, "normal")).toEqual({ allowed: true });
    expect(canAddToToday(5, "normal")).toEqual({ allowed: false, reason: "today_full" });
  });

  it("week limit is stricter in recovery mode", () => {
    expect(canAddToWeek(WIP_LIMITS.recovery.weekMax - 1, "recovery")).toEqual({ allowed: true });
    expect(canAddToWeek(WIP_LIMITS.recovery.weekMax, "recovery")).toEqual({ allowed: false, reason: "week_full" });
  });

  it("enforces one courage task per week", () => {
    expect(canAddCourageTask(0)).toEqual({ allowed: true });
    expect(canAddCourageTask(1)).toEqual({ allowed: false, reason: "courage_full" });
  });

  it("enforces the two-experiment cap", () => {
    expect(canActivateExperiment(1)).toEqual({ allowed: true });
    expect(canActivateExperiment(2)).toEqual({ allowed: false, reason: "experiments_full" });
  });
});

describe("task transitions", () => {
  it("allows the canonical flow", () => {
    expect(canTransition("inbox", "this_week")).toBe(true);
    expect(canTransition("this_week", "today")).toBe(true);
    expect(canTransition("today", "in_progress")).toBe(true);
    expect(canTransition("in_progress", "completed")).toBe(true);
  });

  it("does not skip forward from inbox to today", () => {
    expect(canTransition("inbox", "today")).toBe(false);
  });

  it("treats today→this_week as a deferral", () => {
    const t = transitionTask("today", "this_week");
    expect(t?.event).toBe("deferred");
  });

  it("validTransitions returns stable sets", () => {
    expect(validTransitions("completed")).toContain("inbox");
  });
});

describe("deferral intervention", () => {
  it("intervenes after repeated deferrals", () => {
    expect(deferralIntervention(0).level).toBe("none");
    expect(deferralIntervention(3).level).toBe("intervene");
    expect(deferralIntervention(3).message).toMatch(/deferred/);
  });

  it("provides actions when an avoidance reason is known", () => {
    expect(deferralIntervention(3, "just_avoiding").actions).toContain("start_10min");
  });

  it("maps avoidance reasons to concrete actions", () => {
    expect(DEFERRAL_ACTION_MAP.too_big).toContain("break_down");
    expect(DEFERRAL_ACTION_MAP.just_avoiding).toContain("start_10min");
    expect(DEFERRAL_ACTION_MAP.blocked).toContain("blocker_task");
  });
});

describe("experiments", () => {
  it("rejects a third active experiment", () => {
    const result = assertActiveExperimentLimit(2);
    expect(result.allowed).toBe(false);
    expect(result.message).toMatch(/replace or defer/i);
  });

  it("can activate from planned", () => {
    expect(canTransitionExperiment("planned", "active")).toBe(true);
    expect(canTransitionExperiment("abandoned", "active")).toBe(false);
  });

  it("resolves keep/modify to completed, abandon to abandoned", () => {
    expect(resolveExperimentStatus("active", "keep")).toBe("completed");
    expect(resolveExperimentStatus("active", "abandon")).toBe("abandoned");
  });
});

describe("meta-work vs life-work", () => {
  it("detects planning-as-avoidance", () => {
    expect(isMetaWork("reorganize task categories").isMetaWork).toBe(true);
    expect(isMetaWork("tweak productivity settings").isMetaWork).toBe(true);
    expect(isMetaWork("clear the garage").isMetaWork).toBe(false);
  });

  it("excludes meta-work from momentum", () => {
    expect(metaWorkExcludedFromMomentum(true)).toBe(true);
  });
});

describe("task weight", () => {
  it("five trivial tasks do not outscore one consequential task", () => {
    const trivial = taskWeight({ impact: "low", size: "quick" });
    const consequential = taskWeight({ impact: "high", size: "milestone" });
    expect(trivial * 5).toBeLessThan(consequential);
  });

  it("meta-work earns zero", () => {
    expect(taskWeight({ impact: "high", size: "deep", metaWork: true })).toBe(0);
  });

  it("courage tasks are weighted more heavily", () => {
    expect(taskWeight({ impact: "medium", size: "standard", courage: true })).toBeGreaterThan(
      taskWeight({ impact: "medium", size: "standard" })
    );
  });
});

describe("insight thresholds", () => {
  it("requires sufficient samples before showing findings", () => {
    expect(hasSufficientSample(3, "time_of_day").sufficient).toBe(false);
    expect(hasSufficientSample(12, "time_of_day").sufficient).toBe(true);
  });

  it("does not surface weak correlations", () => {
    const weak = supportsRateInsight({ sampleCount: 12, successCount: 7, kind: "time_of_day" });
    expect(weak.sufficient).toBe(false);
  });

  it("uses cautious language", () => {
    expect(cautiousPhrase(0.9, "positive")).toMatch(/history suggests/i);
    expect(cautiousPhrase(0.9, "positive")).not.toMatch(/because/i);
  });
});