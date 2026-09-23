import { describe, expect, it } from "vitest";
import { parseStoredConversationPath } from "./conversation-confidence-storage";

describe("conversation confidence storage", () => {
  it("preserves saved reflections when loading the focus", () => {
    const reflection = { month: 1, willingness: 3, expression: 4, recovery: null, connection: 2, note: "A useful pause" };
    const path = parseStoredConversationPath({ conversationConfidence: {
      active: true,
      title: "Social Ease & Expression",
      objective: "Connect without performing",
      month: 1,
      status: "active",
      reflections: { "1": reflection },
    } });

    expect(path.reflections?.["1"]).toEqual(reflection);
  });
});
