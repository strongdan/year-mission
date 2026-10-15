import { describe, expect, it } from "vitest";
import { parseStoredConversationPath } from "./conversation-confidence-storage";

describe("conversation confidence storage", () => {
  it("preserves saved reflections while adding confidence defaults", () => {
    const reflection = { month: 1, willingness: 3, expression: 4, recovery: null, connection: 2, note: "A useful pause" };
    const path = parseStoredConversationPath({ conversationConfidence: {
      active: true,
      title: "Custom confidence title",
      objective: "Connect without performing",
      month: 1,
      status: "active",
      reflections: { "1": reflection },
    } });

    expect(path.reflections["1"]).toEqual(reflection);
    expect(path.repIndex).toBe(0);
    expect(path.challengeLevel).toBe("normal");
    expect(path.evidence).toEqual([]);
  });

  it("migrates the old default social title and objective into the broader self-trust focus", () => {
    const path = parseStoredConversationPath({ conversationConfidence: {
      active: true,
      title: "Social Ease & Expression",
      objective: "Become more comfortable around people, express thoughts clearly, sustain conversations more naturally, and build closer relationships without feeling like I have to perform.",
      month: 4,
      status: "active",
    } });

    expect(path.title).toBe("Self-Trust & Confidence");
    expect(path.objective).toContain("Build enough self-trust");
    expect(path.month).toBe(4);
  });

  it("preserves bounded confidence evidence", () => {
    const path = parseStoredConversationPath({ conversationConfidence: {
      active: true,
      title: "Self-Trust & Confidence",
      objective: "Build enough self-trust to act like myself even when I feel awkward, uncertain, imperfect, or disapproved of.",
      month: 2,
      status: "active",
      repIndex: 3,
      challengeLevel: "tiny",
      evidence: [{
        id: "e1",
        createdAt: "2026-10-14T20:00:00.000Z",
        repId: "allow-pause",
        category: "visibility",
        outcome: "awkward-handled",
        lesson: "The pause passed on its own.",
      }],
    } });

    expect(path.repIndex).toBe(3);
    expect(path.challengeLevel).toBe("tiny");
    expect(path.evidence[0]?.outcome).toBe("awkward-handled");
  });
});
