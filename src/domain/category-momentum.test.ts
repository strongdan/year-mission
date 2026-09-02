import { describe, expect, it } from "vitest";
import { buildCategoryMomentum } from "./category-momentum";

describe("buildCategoryMomentum", () => {
  it("maps home storage to the visible Self category", () => {
    const result = buildCategoryMomentum([
      { date: "2026-09-02", body_score: 60, money_score: 50, home_score: 70, capability_score: 80 },
      { date: "2026-09-01", body_score: 55, money_score: 52, home_score: 60, capability_score: 78 },
    ]);
    const self = result.find((item) => item.key === "self");
    expect(self?.label).toBe("Self");
    expect(self?.current).toBe(70);
    expect(self?.change).toBe(10);
    expect(self?.direction).toBe("growing");
  });

  it("treats sparse data as gathering, not failure", () => {
    const [body] = buildCategoryMomentum([
      { date: "2026-09-01", body_score: null, money_score: null, home_score: null, capability_score: null },
    ]);
    expect(body.current).toBeNull();
    expect(body.direction).toBe("gathering");
  });

  it("calls small changes holding and larger declines rebuilding", () => {
    const result = buildCategoryMomentum([
      { date: "2026-09-02", body_score: 52, money_score: 40, home_score: null, capability_score: null },
      { date: "2026-09-01", body_score: 50, money_score: 50, home_score: null, capability_score: null },
    ]);
    expect(result.find((item) => item.key === "body")?.direction).toBe("holding");
    expect(result.find((item) => item.key === "money")?.direction).toBe("rebuilding");
  });
});
