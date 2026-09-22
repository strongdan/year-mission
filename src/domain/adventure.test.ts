import { describe, expect, it } from "vitest";
import { buildAdventureProgress, seasonForDate, themeForSeason } from "./adventure";
import { alaskaStateHolidays, holidayForDate } from "./holidays";
import type { DailyCheckin, Task, Workout } from "@/types/models";

const task = (overrides: Partial<Task> = {}): Task => ({ id: "t1", user_id: "u1", project_id: null, domain_id: null, title: "Do thing", notes: null, status: "completed", estimated_minutes: 30, impact: "medium", priority: "normal", scheduled_date: null, due_date: null, weekly_commitment: false, weekly_win: false, defer_count: 0, courage_task: false, meta_work: false, source: "manual", created_at: "2026-09-10T08:00:00Z", updated_at: "2026-09-10T09:00:00Z", completed_at: "2026-09-10T18:00:00Z", ...overrides });
const checkin = (overrides: Partial<DailyCheckin> = {}): DailyCheckin => ({ id: "c1", user_id: "u1", date: "2026-09-10", alcohol_free: false, weight: null, steps: null, water: null, mood: 3, energy: 3, sleep_hours: null, notes: null, evening_reset_completion: null, evening_reset_variant: null, ...overrides });
const workout = (overrides: Partial<Workout> = {}): Workout => ({ id: "w1", user_id: "u1", date: "2026-09-10", type: "mobility", duration_minutes: 15, notes: null, metadata: {}, ...overrides });

describe("adventure progression", () => {
  it("shows calendar position and meaningful evidence without XP or levels", () => {
    const result = buildAdventureProgress({ today: "2026-09-10", planStart: "2026-01-01", seasonStart: "2026-06-21", completedTasks: [task()], checkins: [checkin()], workouts: [workout()], health: [] });
    expect(result.today.meaningfulTaskCount).toBe(1);
    expect(result.totalMeaningfulMilestones).toBeGreaterThan(0);
    expect(result.dayProgress).toBeGreaterThan(0);
  });
  it("does not count meta-work as a meaningful milestone", () => {
    const result = buildAdventureProgress({ today: "2026-09-10", planStart: "2026-01-01", seasonStart: "2026-06-21", completedTasks: [task({ meta_work: true })], checkins: [], workouts: [], health: [] });
    expect(result.today.meaningfulTaskCount).toBe(0);
  });
  it("uses calendar seasons at boundaries", () => {
    expect(seasonForDate("2026-03-19").id).toBe("winter"); expect(seasonForDate("2026-03-20").id).toBe("spring"); expect(seasonForDate("2026-06-21").id).toBe("summer"); expect(seasonForDate("2026-09-22").id).toBe("fall"); expect(seasonForDate("2026-12-21").id).toBe("winter");
  });
  it("keeps holiday scenes descriptive and non-evaluative", () => { expect(holidayForDate("2026-07-06")?.name).toBe("America 250 State Holiday"); expect(alaskaStateHolidays(2026)).toHaveLength(13); });
  it("rotates season themes deterministically", () => { expect(themeForSeason(1)).toBe("forest"); expect(themeForSeason(4)).toBe("aurora"); expect(themeForSeason(5)).toBe("forest"); });
});
