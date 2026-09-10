import { describe, expect, it } from "vitest";
import { buildAdventureProgress, seasonForDate, themeForSeason } from "./adventure";
import type { DailyCheckin, Task, Workout } from "@/types/models";

const task = (overrides: Partial<Task> = {}): Task => ({
  id: "t1", user_id: "u1", project_id: null, domain_id: null, title: "Do thing", notes: null,
  status: "completed", estimated_minutes: 30, impact: "medium", priority: "normal", scheduled_date: null,
  due_date: null, weekly_commitment: false, weekly_win: false, defer_count: 0, courage_task: false,
  meta_work: false, source: "manual", created_at: "2026-09-10T08:00:00Z", updated_at: "2026-09-10T09:00:00Z",
  completed_at: "2026-09-10T18:00:00Z", ...overrides,
});

const checkin = (overrides: Partial<DailyCheckin> = {}): DailyCheckin => ({
  id: "c1", user_id: "u1", date: "2026-09-10", alcohol_free: false, weight: null, steps: null, water: null,
  mood: 3, energy: 3, sleep_hours: null, notes: null, evening_reset_completion: null, evening_reset_variant: null,
  ...overrides,
});

const workout = (overrides: Partial<Workout> = {}): Workout => ({
  id: "w1", user_id: "u1", date: "2026-09-10", type: "mobility", duration_minutes: 15, notes: null, metadata: {}, ...overrides,
});

describe("adventure progression", () => {
  it("rewards meaningful work, movement, and check-ins without exceeding the daily cap", () => {
    const result = buildAdventureProgress({
      today: "2026-09-10",
      seasonStart: "2026-06-21",
      completedTasks: [task({ weekly_win: true, courage_task: true })],
      checkins: [checkin({ evening_reset_completion: "target" })],
      workouts: [workout()],
      health: [{ date: "2026-09-10", steps: 10000, active_energy_kcal: 500, exercise_minutes: 30, stand_hours: 12, hrv_sdnn_ms: 50, resting_heart_rate_bpm: 60, sleep_minutes: 450 }],
    });
    expect(result.today.taskXp).toBe(95);
    expect(result.today.checkinXp).toBe(35);
    expect(result.today.movementXp).toBeGreaterThan(0);
    expect(result.today.totalXp).toBeLessThanOrEqual(260);
    expect(result.dayProgress).toBeGreaterThan(50);
  });

  it("awards zero XP to meta-work tasks", () => {
    const result = buildAdventureProgress({
      today: "2026-09-10",
      seasonStart: "2026-06-21",
      completedTasks: [task({ meta_work: true, impact: "high" })],
      checkins: [], workouts: [], health: [],
    });
    expect(result.today.taskXp).toBe(0);
  });

  it("uses calendar seasons at the equinox and solstice boundaries", () => {
    expect(seasonForDate("2026-03-19").id).toBe("winter");
    expect(seasonForDate("2026-03-20").id).toBe("spring");
    expect(seasonForDate("2026-06-21").id).toBe("summer");
    expect(seasonForDate("2026-09-22").id).toBe("fall");
    expect(seasonForDate("2026-12-21").id).toBe("winter");
  });

  it("keeps the intended seasonal emphasis", () => {
    expect(seasonForDate("2026-07-15").emphasis).toContain("Outdoor exercise");
    expect(seasonForDate("2026-10-15").emphasis).toContain("Career development");
    expect(seasonForDate("2027-01-15").emphasis).toContain("Learning");
  });

  it("rotates legacy season themes deterministically", () => {
    expect(themeForSeason(1)).toBe("forest");
    expect(themeForSeason(4)).toBe("aurora");
    expect(themeForSeason(5)).toBe("forest");
  });
});
