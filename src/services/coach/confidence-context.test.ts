import { describe, expect, it } from "vitest";
import { buildConfidenceCoachContext } from "./confidence-context";
import { parseStoredConversationPath } from "@/domain/conversation-confidence-storage";
import { CONFIDENCE_ROADMAP } from "@/domain/confidence-roadmap";

function preferences(overrides: Record<string, unknown> = {}) {
  return {
    unrelatedPrivateSetting: "never send this",
    conversationConfidence: {
      ...parseStoredConversationPath(null),
      active: true,
      month: 5,
      reflections: { "5": { month: 5, note: "private reflection" } },
      evidence: [{
        id: "past-rep", createdAt: "2026-11-22T19:00:00.000Z", repId: "genuine-thought",
        category: "social", outcome: "awkward-handled", lesson: "private lesson",
      }],
      ...overrides,
    },
  };
}

describe("confidence Coach context", () => {
  it("includes only the selected month's guidance and respects the user's custom objective", () => {
    const context = buildConfidenceCoachContext(preferences({ objective: "My own goal" }));
    const month = CONFIDENCE_ROADMAP.find((item) => item.month === 5)!;
    expect(context).toMatchObject({ month: 5, status: "active", objective: "My own goal", monthTheme: month.title });
    expect(context?.suggestedActions).toEqual(month.weeklyActions);
    expect(context?.recoverySteps).toHaveLength(4);
    expect(JSON.stringify(context)).not.toMatch(/private reflection|private lesson|never send this/);
  });

  it("keeps the pause visible without assigning suggested actions", () => {
    const context = buildConfidenceCoachContext(preferences({ status: "paused" }));
    expect(context).toMatchObject({ month: 5, status: "paused", suggestedActions: [] });
  });

  it("does not silently activate an absent, inactive, stopped, or invalid focus", () => {
    expect(buildConfidenceCoachContext(null)).toBeNull();
    expect(buildConfidenceCoachContext(preferences({ active: false }))).toBeNull();
    expect(buildConfidenceCoachContext(preferences({ status: "stopped" }))).toBeNull();
    expect(buildConfidenceCoachContext(preferences({ month: 50 }))).toBeNull();
  });
});
