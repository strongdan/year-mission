import { describe, it, expect } from "vitest";
import {
  computeReliability,
  detectOvercommitment,
  reliabilityInterpretation,
} from "./reliability";

describe("computeReliability", () => {
  it("promises are weighted more heavily than casual tasks", () => {
    const allPromisesKept = computeReliability({
      outcomes: [
        { type: "promise", status: "kept" },
        { type: "promise", status: "kept" },
      ],
    });
    const promisesMissedButTasksKept = computeReliability({
      outcomes: [
        { type: "promise", status: "missed" },
        { type: "promise", status: "missed" },
        { type: "task", status: "kept" },
      ],
    });
    expect(allPromisesKept.score).toBe(100);
    expect(promisesMissedButTasksKept.score).toBeLessThan(50);
  });

  it("renegotiated commitments count more than missed ones", () => {
    const renegotiated = computeReliability({
      outcomes: [{ type: "promise", status: "renegotiated" }],
    });
    const missed = computeReliability({
      outcomes: [{ type: "promise", status: "missed" }],
    });
    expect(renegotiated.score).toBeGreaterThan(missed.score);
  });

  it("handles empty history", () => {
    expect(computeReliability({ outcomes: [] })).toMatchObject({ score: 0, weightedTotal: 0 });
  });
});

describe("detectOvercommitment", () => {
  it("flags overcommitment when volume is high and follow-through low", () => {
    const signal = detectOvercommitment(
      Array.from({ length: 10 }, () => ({ type: "promise" as const, status: "missed" as const }))
    );
    expect(signal.isOvercommitted).toBe(true);
    expect(signal.recommendedCap).toBeGreaterThan(0);
  });

  it("does not flag high volume with high follow-through", () => {
    const signal = detectOvercommitment(
      Array.from({ length: 10 }, () => ({ type: "promise" as const, status: "kept" as const }))
    );
    expect(signal.isOvercommitted).toBe(false);
  });
});

describe("reliabilityInterpretation", () => {
  it("uses neutral, non-punitive language", () => {
    expect(reliabilityInterpretation(20)).toContain("committing to less");
    expect(reliabilityInterpretation(90)).toContain("keeping the commitments");
    expect(reliabilityInterpretation(10).toLowerCase()).not.toContain("fail");
  });
});