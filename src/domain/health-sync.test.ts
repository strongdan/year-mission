import { describe, expect, it } from "vitest";
import { mergeHealthSummary } from "@/domain/health-sync";

describe("mergeHealthSummary", () => {
  it("preserves omitted metrics and updates supplied metrics", () => {
    const result = mergeHealthSummary({ steps: 1000, active_energy_kcal: 300, exercise_minutes: 20, stand_hours: 8, hrv_sdnn_ms: 54, resting_heart_rate_bpm: 60, sleep_minutes: 420, observed_at: "2026-09-21T10:00:00.000Z" }, { steps: 2200 }, "2026-09-22T10:00:00.000Z");
    expect(result.steps).toBe(2200);
    expect(result.hrv_sdnn_ms).toBe(54);
    expect(result.sleep_minutes).toBe(420);
  });

  it("is safe and idempotent for repeated partial writes", () => {
    const first = mergeHealthSummary(undefined, { steps: 1000, hrv_sdnn_ms: 48 }, "2026-09-22T10:00:00.000Z");
    expect(mergeHealthSummary(first, { steps: 1000 }, "2026-09-22T10:01:00.000Z")).toEqual(first);
  });
});
