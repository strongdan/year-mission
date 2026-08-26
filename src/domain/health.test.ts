import { describe, expect, it } from "vitest";
import { buildHealthSummary, healthKitSyncSchema } from "@/domain/health";

describe("healthKitSyncSchema", () => {
  it("accepts compact daily metrics and workouts", () => {
    const result = healthKitSyncSchema.parse({
      daily: [{ date: "2026-08-22", steps: 8500, sleepHours: 7.2 }],
      workouts: [
        {
          id: "workout-1",
          date: "2026-08-22",
          type: "cycling",
          durationMinutes: 30,
          distanceMiles: 4.2,
        },
      ],
    });

    expect(result.source).toBe("healthkit");
    expect(result.workouts).toHaveLength(1);
  });
});

describe("buildHealthSummary", () => {
  it("suggests recovery when sleep drops while training load is maintained", () => {
    const checkins = [
      ...Array.from({ length: 7 }, (_, index) => ({
        date: `2026-08-${String(9 + index).padStart(2, "0")}`,
        sleep_hours: 7.5,
        steps: 9000,
      })),
      ...Array.from({ length: 7 }, (_, index) => ({
        date: `2026-08-${String(16 + index).padStart(2, "0")}`,
        sleep_hours: 6.5,
        steps: 8500,
      })),
    ];
    const workouts = [
      { date: "2026-08-10", duration_minutes: 30 },
      { date: "2026-08-12", duration_minutes: 30 },
      { date: "2026-08-17", duration_minutes: 35 },
      { date: "2026-08-20", duration_minutes: 35 },
    ];

    const summary = buildHealthSummary(checkins, workouts, "2026-08-22");

    expect(summary.adaptation.suggestedMode).toBe("recovery");
    expect(summary.adaptation.requiresApproval).toBe(true);
  });

  it("does not change the plan when data coverage is thin", () => {
    const summary = buildHealthSummary(
      [{ date: "2026-08-22", steps: 7000, sleep_hours: 7 }],
      [],
      "2026-08-22"
    );

    expect(summary.adaptation.suggestedMode).toBe("normal");
    expect(summary.adaptation.confidence).toBe("low");
  });
});
