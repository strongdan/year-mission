import { describe, expect, it } from "vitest";
import {
  CONFIDENCE_PHASES,
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

describe("conversation confidence", () => {
  it("defines twelve relative confidence themes", () => {
    expect(CONVERSATION_MONTHS).toHaveLength(12);
    expect(mondayConversationPlan(1).month.theme).toBe("Notice the approval reflex");
    expect(mondayConversationPlan(12).month.theme).toBe("Sustainable self-trust");
  });

  it("groups the year into four confidence phases", () => {
    expect(CONFIDENCE_PHASES).toHaveLength(4);
    expect(confidencePhaseForMonth(1).title).toBe("Be Seen");
    expect(confidencePhaseForMonth(4).title).toBe("Take Up Space");
    expect(confidencePhaseForMonth(7).title).toBe("Trust Yourself");
    expect(confidencePhaseForMonth(10).title).toBe("Choose Your Life");
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
