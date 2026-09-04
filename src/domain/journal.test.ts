import { describe, expect, it } from "vitest";
import { parseJournalAnalysis } from "./journal";

describe("parseJournalAnalysis", () => {
  it("parses the requested structured response", () => {
    expect(parseJournalAnalysis('{"analysis":"You sound overloaded by competing priorities.","suggestedAction":"Choose one task to finish before lunch."}')).toEqual({
      analysis: "You sound overloaded by competing priorities.",
      suggestedAction: "Choose one task to finish before lunch.",
    });
  });

  it("accepts fenced JSON", () => {
    expect(parseJournalAnalysis('```json\n{"analysis":"Useful pattern.","suggestedAction":null}\n```')).toEqual({
      analysis: "Useful pattern.",
      suggestedAction: null,
    });
  });

  it("preserves useful prose when a provider ignores the JSON contract", () => {
    expect(parseJournalAnalysis("You may be avoiding the task because it is underspecified.")).toEqual({
      analysis: "You may be avoiding the task because it is underspecified.",
      suggestedAction: null,
    });
  });

  it("bounds provider-controlled output", () => {
    const result = parseJournalAnalysis(JSON.stringify({ analysis: "a".repeat(3000), suggestedAction: "b".repeat(500) }));
    expect(result.analysis).toHaveLength(2400);
    expect(result.suggestedAction).toHaveLength(240);
  });
});
