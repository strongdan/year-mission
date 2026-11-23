import { describe, expect, it } from "vitest";
import { parseStoredConversationPath } from "./conversation-confidence-storage";
import { CONVERSATION_CONFIDENCE_OBJECTIVE } from "./conversation-confidence";

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
    expect(path.objective).toBe(CONVERSATION_CONFIDENCE_OBJECTIVE);
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
    expect(path.objective).toBe(CONVERSATION_CONFIDENCE_OBJECTIVE);
    expect(path.month).toBe(2);
  });

  it("preserves a custom objective, paused month, reflections, and historical rep IDs", () => {
    const stored = {
      active: true,
      title: "My own focus",
      objective: "Have more ordinary conversations with my neighbors",
      month: 9,
      status: "paused",
      repIndex: 27,
      challengeLevel: "tiny",
      reflections: { "9": { month: 9, note: "One useful lesson" } },
      evidence: [{
        id: "old-evidence",
        createdAt: "2026-10-14T20:00:00.000Z",
        repId: "admit-mistake",
        category: "competence",
        outcome: "awkward-handled",
        lesson: "I corrected the fact and continued.",
      }],
    };
    expect(parseStoredConversationPath({ conversationConfidence: stored })).toEqual(stored);
  });

  it("normalizes only the previous default without reactivating a stopped focus", () => {
    const path = parseStoredConversationPath({ conversationConfidence: {
      active: false,
      title: "A title I chose",
      objective: "Build enough self-trust to act like myself even when I feel awkward, uncertain, imperfect, or disapproved of.",
      month: 12,
      status: "stopped",
      repIndex: 42,
    } });
    expect(path).toMatchObject({
      active: false,
      title: "A title I chose",
      objective: CONVERSATION_CONFIDENCE_OBJECTIVE,
      month: 12,
      status: "stopped",
      repIndex: 42,
    });
  });
});
