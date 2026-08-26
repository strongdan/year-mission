import { describe, expect, it } from "vitest";
import { seasonGrowthFrame } from "./season-growth";

describe("seasonGrowthFrame", () => {
  it("connects each canonical season to a personal-growth purpose", () => {
    for (const name of ["stabilize", "build", "transform", "convert"]) {
      const frame = seasonGrowthFrame(name);
      expect(frame.purpose.length).toBeGreaterThan(20);
      expect(frame.reflection.endsWith("?")).toBe(true);
    }
  });

  it("handles custom season names without losing the growth connection", () => {
    const frame = seasonGrowthFrame("Rebuild");
    expect(frame.label).toBe("Rebuild");
    expect(frame.reflection).toContain("become");
  });
});
