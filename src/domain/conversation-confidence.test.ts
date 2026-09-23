import { describe, expect, it } from "vitest";
import {
  CONVERSATION_MONTHS,
  applyMonthChoice,
  conversationFloor,
  currentConversationMonth,
  formatWorkoutCountdown,
  isConversationSkipNonPunitive,
  mondayConversationPlan,
} from "./conversation-confidence";
import { resourcesForMonth, SUPPORT_RESOURCES } from "./support-resources";

describe("conversation confidence", () => {
  it("defines twelve relative themes", () => {
    expect(CONVERSATION_MONTHS).toHaveLength(12);
    expect(mondayConversationPlan(1).month.theme).toBe("Speak without performing");
    expect(mondayConversationPlan(12).month.theme).toBe("Sustainable connection");
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

  it("provides a hard-week floor without catch-up debt", () => {
    expect(conversationFloor("hard-week")).toContain("no catch-up debt");
  });

  it("does not penalize skipping", () => {
    expect(isConversationSkipNonPunitive()).toEqual({ momentumDelta: 0, xpDelta: 0, reliabilityDelta: 0, createsDebt: false });
  });

  it("maps months to optional support resources with conservative access labels", () => {
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
