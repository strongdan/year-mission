import { describe, expect, it } from "vitest";
import { LIFE_MENU, movementSignal, recoverySignal, type HealthSummary } from "./life-balance";

function summary(overrides: Partial<HealthSummary> = {}): HealthSummary {
  return {
    date: "2026-09-10",
    steps: 5000,
    active_energy_kcal: 400,
    exercise_minutes: 30,
    stand_hours: 10,
    hrv_sdnn_ms: 50,
    resting_heart_rate_bpm: 60,
    sleep_minutes: 450,
    ...overrides,
  };
}

describe("life balance", () => {
  it("keeps the life menu intentionally narrow", () => {
    expect(LIFE_MENU.map((item) => item.id)).toEqual([
      "outside",
      "pool",
      "cold-plunge",
      "mobility",
      "masters",
      "reset",
    ]);
  });

  it("labels clearly lower-than-baseline recovery signals as low", () => {
    const history = Array.from({ length: 7 }, (_, index) => summary({ date: `2026-09-0${index + 1}`, hrv_sdnn_ms: 60, resting_heart_rate_bpm: 60 }));
    expect(recoverySignal(summary({ hrv_sdnn_ms: 45, resting_heart_rate_bpm: 68 }), history)).toBe("low");
  });

  it("does not invent recovery when baseline data is missing", () => {
    expect(recoverySignal(summary({ hrv_sdnn_ms: 45, resting_heart_rate_bpm: null }), [])).toBe("unknown");
  });

  it("summarizes movement without assigning a score", () => {
    expect(movementSignal(summary())).toContain("5,000 steps");
    expect(movementSignal(summary())).toContain("30 exercise min");
  });
});
