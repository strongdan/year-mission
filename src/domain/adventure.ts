import type { Task, DailyCheckin, Workout } from "@/types/models";
import { holidayForDate, type GameHoliday } from "@/domain/holidays";

export type AdventureTheme = "forest" | "coast" | "alpine" | "aurora";
export type CalendarSeason = "spring" | "summer" | "fall" | "winter";
export interface SeasonProfile { id: CalendarSeason; name: string; startDate: string; endDate: string; theme: AdventureTheme; objective: string; emphasis: string[]; }
export interface HealthDay { date: string; steps: number | null; active_energy_kcal: number | null; exercise_minutes: number | null; stand_hours: number | null; hrv_sdnn_ms: number | null; resting_heart_rate_bpm: number | null; sleep_minutes: number | null; }
export interface AdventureDayContext { date: string; meaningfulTaskCount: number; hasMovementObservation: boolean; hasCheckin: boolean; holiday: GameHoliday | null; }
export interface AdventureProgress { today: AdventureDayContext; totalMeaningfulMilestones: number; weekMeaningfulMilestones: number; monthMeaningfulMilestones: number; seasonMeaningfulMilestones: number; dayProgress: number; weekProgress: number; monthProgress: number; seasonProgress: number; }
function iso(year: number, month: number, day: number): string { return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`; }
export function seasonForDate(date: string): SeasonProfile {
  const year = Number(date.slice(0, 4)); const spring = iso(year, 3, 20), summer = iso(year, 6, 21), fall = iso(year, 9, 22), winter = iso(year, 12, 21);
  if (date >= winter) return { id: "winter", name: "Winter", startDate: winter, endDate: iso(year + 1, 3, 19), theme: "aurora", objective: "Deep season: learn, strengthen your craft, develop yourself, recover, and reflect.", emphasis: ["Learning", "Career development", "Personal development", "Recovery"] };
  if (date >= fall) return { id: "fall", name: "Fall", startDate: fall, endDate: iso(year, 12, 20), theme: "alpine", objective: "Turn inward with purpose: learning, career development, personal development, and stronger routines.", emphasis: ["Learning", "Career development", "Personal development", "Routines"] };
  if (date >= summer) return { id: "summer", name: "Summer", startDate: summer, endDate: iso(year, 9, 21), theme: "coast", objective: "Use the long days: get things done outside, exercise outside, and make room for family adventures.", emphasis: ["Outside projects", "Outdoor exercise", "Family adventures", "Physical momentum"] };
  if (date >= spring) return { id: "spring", name: "Spring", startDate: spring, endDate: iso(year, 6, 20), theme: "forest", objective: "Re-emerge: rebuild outdoor momentum, move more, and prepare the projects you want to enjoy in summer.", emphasis: ["Outside time", "Movement", "Preparation", "Re-entry"] };
  return { id: "winter", name: "Winter", startDate: iso(year - 1, 12, 21), endDate: iso(year, 3, 19), theme: "aurora", objective: "Deep season: learn, strengthen your craft, develop yourself, recover, and reflect.", emphasis: ["Learning", "Career development", "Personal development", "Recovery"] };
}
function mondayOf(date: Date): string { const d = new Date(date); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toISOString().slice(0, 10); }
function progress(position: number, total: number): number { return Math.max(0, Math.min(100, Math.round((position / Math.max(1, total)) * 100))); }
export function themeForSeason(sequence: number): AdventureTheme { return (["forest", "coast", "alpine", "aurora"] as const)[Math.abs(sequence - 1) % 4]; }
export function buildAdventureProgress(input: { today: string; planStart: string; seasonStart: string; completedTasks: Task[]; checkins: DailyCheckin[]; workouts: Workout[]; health: HealthDay[]; }): AdventureProgress {
  const taskGroups = new Map<string, Task[]>();
  for (const task of input.completedTasks) { const date = task.completed_at?.slice(0, 10); if (date && !task.meta_work) taskGroups.set(date, [...(taskGroups.get(date) ?? []), task]); }
  const checkinMap = new Map(input.checkins.map((value) => [value.date, value])); const healthMap = new Map(input.health.map((value) => [value.date, value])); const workoutDates = new Set(input.workouts.map((workout) => workout.date));
  const dates = new Set<string>([input.today, ...taskGroups.keys(), ...checkinMap.keys(), ...healthMap.keys(), ...workoutDates]); const byDate = new Map<string, AdventureDayContext>();
  for (const date of dates) byDate.set(date, { date, meaningfulTaskCount: (taskGroups.get(date) ?? []).length, hasMovementObservation: healthMap.has(date) || workoutDates.has(date), hasCheckin: checkinMap.has(date), holiday: holidayForDate(date) });
  const values = [...byDate.values()]; const weekStart = mondayOf(new Date(`${input.today}T12:00:00`)); const monthStart = `${input.today.slice(0, 7)}-01`;
  const meaningful = (from: string) => values.filter((day) => day.date >= from && day.date <= input.today).reduce((sum, day) => sum + day.meaningfulTaskCount + (day.hasCheckin ? 1 : 0), 0);
  const today = byDate.get(input.today) ?? { date: input.today, meaningfulTaskCount: 0, hasMovementObservation: false, hasCheckin: false, holiday: holidayForDate(input.today) }; const weekday = (new Date(`${input.today}T12:00:00Z`).getUTCDay() + 6) % 7;
  return { today, totalMeaningfulMilestones: meaningful(input.planStart), weekMeaningfulMilestones: meaningful(weekStart), monthMeaningfulMilestones: meaningful(monthStart), seasonMeaningfulMilestones: meaningful(input.seasonStart), dayProgress: progress(weekday + 1, 7), weekProgress: progress(meaningful(weekStart), 7), monthProgress: progress(meaningful(monthStart), 20), seasonProgress: progress(meaningful(input.seasonStart), 60) };
}
