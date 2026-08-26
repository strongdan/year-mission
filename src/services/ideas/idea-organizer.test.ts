import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/ai", () => ({
  getAiProviderForRequest: async () => ({ name: "mock" }),
}));

import { organizeIdea } from "@/services/ideas/idea-organizer";

describe("idea organizer", () => {
  it("extracts concrete actions without turning every thought into a task", async () => {
    const result = await organizeIdea(
      "I feel like the garage has been on my mind. I need to call the contractor. Buy storage bins. I wonder if the layout should change someday.",
      "2026-08-26",
    );

    expect(result.tasks.map((task) => task.title.toLowerCase())).toEqual(
      expect.arrayContaining([expect.stringContaining("call the contractor"), expect.stringContaining("buy storage bins")]),
    );
    expect(result.tasks.some((task) => task.title.toLowerCase().includes("layout should change someday"))).toBe(false);
  });

  it("keeps non-actionable dumps as ideas instead of inventing obligations", async () => {
    const result = await organizeIdea(
      "I keep thinking about what a more adventurous year would feel like and why familiar routines make time blur together.",
      "2026-08-26",
    );

    expect(result.tasks).toHaveLength(0);
    expect(result.summary.toLowerCase()).toContain("saved");
  });

  it("never returns more than the bounded task count", async () => {
    const input = Array.from({ length: 20 }, (_, index) => `Buy item ${index + 1}.`).join(" ");
    const result = await organizeIdea(input, "2026-08-26");
    expect(result.tasks.length).toBeLessThanOrEqual(12);
  });
});
