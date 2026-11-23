import { describe, expect, it } from "vitest";
import {
  CONFIDENCE_PHASES,
  CONFIDENCE_MONTH_REPS,
  CONVERSATION_MONTHS,
  applyMonthChoice,
  confidencePhaseForMonth,
  conversationFloor,
  currentConfidenceRep,
  currentConversationMonth,
  formatWorkoutCountdown,
  isConversationSkipNonPunitive,
  mondayConversationPlan,
  summarizeConfidenceEvidence,
  type ConfidenceEvidence,
} from "./conversation-confidence";
import { resourcesForMonth, SUPPORT_RESOURCES } from "./support-resources";
import { CONFIDENCE_METHODS, CONFIDENCE_ROADMAP, CONFIDENCE_SOURCES } from "./confidence-roadmap";

describe("conversation confidence", () => {
  it("defines twelve relative confidence themes", () => {
    expect(CONVERSATION_MONTHS).toHaveLength(12);
    expect(CONFIDENCE_ROADMAP.map((month) => month.month)).toEqual(Array.from({ length: 12 }, (_, index) => index + 1));
    for (const month of CONFIDENCE_ROADMAP) {
      const plan = mondayConversationPlan(month.month);
      expect(plan.month.theme).toBe(month.title);
      expect(plan.skill).toBe(month.skill);
      expect(plan.actions).toEqual(month.weeklyActions);
      expect(plan.actions).toHaveLength(2);
    }
  });

  it("groups the year into four confidence phases", () => {
    expect(CONFIDENCE_PHASES).toHaveLength(4);
    expect(CONFIDENCE_PHASES.flatMap((phase) => [...phase.months])).toEqual(CONFIDENCE_ROADMAP.map((month) => month.month));
    for (const phase of CONFIDENCE_PHASES) {
      for (const month of phase.months) expect(confidencePhaseForMonth(month)).toBe(phase);
    }
  });

  it("keeps pause and repeat user-controlled", () => {
    expect(applyMonthChoice(4, "pause")).toEqual({ month: 4, status: "paused" });
    expect(applyMonthChoice(4, "repeat")).toEqual({ month: 4, status: "active" });
    expect(currentConversationMonth({ month: 4, status: "paused" })).toBe(4);
  });

  it("only advances after an explicit next or skip choice", () => {
    expect(currentConversationMonth({ month: 4, status: "active" })).toBe(4);
    expect(currentConversationMonth({ month: 4, status: "active", monthChoice: "next" })).toBe(5);
    expect(currentConversationMonth({ month: 12, status: "active", monthChoice: "skip" })).toBe(12);
  });

  it("provides tiny versions without changing the underlying rep", () => {
    const normal = currentConfidenceRep({ month: 7, repIndex: 0, challengeLevel: "normal" });
    const tiny = currentConfidenceRep({ month: 7, repIndex: 0, challengeLevel: "tiny" });
    expect(normal.id).toBe("attempt-before-ai");
    expect(tiny.id).toBe(normal.id);
    expect(tiny.label).toContain("Write down");
  });

  it("offers month-specific practice with recovery available from the start and throughout the year", () => {
    expect(currentConfidenceRep({ month: 1 }).id).toBe("recover-and-rejoin");
    expect(currentConfidenceRep({ month: 3 }).id).toBe("listen-and-repair");
    expect(currentConfidenceRep({ month: 5 }).id).toBe("initiate-plan");
    expect(currentConfidenceRep({ month: 9 }).id).toBe("meaningful-visible-step");
    expect(currentConfidenceRep({ month: 11 }).id).toBe("return-with-one-step");
    for (const [month, ids] of Object.entries(CONFIDENCE_MONTH_REPS)) {
      expect(ids).toContain("recover-and-rejoin");
      for (let index = 0; index < ids.length; index += 1) {
        const normal = currentConfidenceRep({ month: Number(month), repIndex: index });
        const tiny = currentConfidenceRep({ month: Number(month), repIndex: index, challengeLevel: "tiny" });
        expect(normal.id).toBe(ids[index]);
        expect(tiny.id).toBe(normal.id);
        expect(tiny.label).toBe(normal.tiny);
      }
      expect(currentConfidenceRep({ month: Number(month), repIndex: ids.length }).id).toBe(ids[0]);
    }
  });

  it("keeps clinical evidence links resolvable and uniquely identified", () => {
    const ids = new Set(CONFIDENCE_SOURCES.map((source) => source.id));
    expect(ids.size).toBe(CONFIDENCE_SOURCES.length);
    for (const method of CONFIDENCE_METHODS) {
      expect(method.sourceIds.length).toBeGreaterThan(0);
      for (const id of method.sourceIds) expect(ids.has(id)).toBe(true);
    }
    for (const source of CONFIDENCE_SOURCES) expect(new URL(source.url).protocol).toBe("https:");
  });

  it("summarizes evidence without creating a score", () => {
    const evidence = [
      { id: "1", createdAt: "2026-10-14T20:00:00.000Z", repId: "a", category: "social", outcome: "nothing-bad" },
      { id: "2", createdAt: "2026-10-14T21:00:00.000Z", repId: "b", category: "opinion", outcome: "disapproval-handled" },
      { id: "3", createdAt: "2026-10-14T22:00:00.000Z", repId: "c", category: "visibility", outcome: "awkward-handled" },
    ] satisfies ConfidenceEvidence[];
    expect(summarizeConfidenceEvidence(evidence)).toEqual({
      total: 3,
      fearedOutcomeDidNotHappen: 1,
      awkwardAndHandled: 1,
      disapprovalAndHandled: 1,
      noticedAvoidance: 0,
    });
  });

  it("provides a hard-week floor without catch-up debt", () => {
    expect(conversationFloor("hard-week")).toContain("no catch-up debt");
  });

  it("does not penalize skipping", () => {
    expect(isConversationSkipNonPunitive()).toEqual({ momentumDelta: 0, xpDelta: 0, reliabilityDelta: 0, createsDebt: false });
  });

  it("keeps optional social support resources available", () => {
    expect(resourcesForMonth(1).some((resource) => resource.id === "ruth-quietly-confident")).toBe(true);
    expect(SUPPORT_RESOURCES.find((resource) => resource.id === "freddy-social-anxiety")?.access).toBe("verify");
  });

  it("formats the five-minute workout without a sixty-second display", () => {
    expect(formatWorkoutCountdown(0)).toBe("05:00");
    expect(formatWorkoutCountdown(59)).toBe("04:01");
    expect(formatWorkoutCountdown(60)).toBe("04:00");
    expect(formatWorkoutCountdown(299)).toBe("00:01");
    expect(formatWorkoutCountdown(300)).toBe("00:00");
  });
});
