import type { Task, DailyCheckin, Workout } from "@/types/models";

export type AdventureTheme = "forest" | "coast" | "alpine" | "aurora";

export interface HealthDay {
  date: string;
  steps: number | null;
  active_energy_kcal: number | null;
  exercise_minutes: number | null;
  stand_hours: number | null;
  hrv_sdnn_ms: number | null;
  resting_heart_rate_bpm: number | null;
  sleep_minutes: number | null;
}

export interface AdventureDayScore {
  date: string;
  taskXp: number;
  movementXp: number;
  checkinXp: number;
  totalXp: number;
}

export interface AdventureProgress {
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  today: AdventureDayScore;
  weekXp: number;
  monthXp: number;
  seasonXp: number;
  dayProgress: number;
  weekProgress: number;
  monthProgress: number;
  seasonProgress: number;
}

const DAY_TARGET_XP = 180;
const WEEK_TARGET_XP = 900;
const MONTH_TARGET_XP = 3600;
const SEASON_TARGET_XP = 10800;
const LEVEL_XP = 500;

function taskXp(task: Pick<Task, "impact" | "weekly_win" | "courage_task" | "meta_work">): number {
  if (task.meta_work) return 0;
  let xp = task.impact === "high" ? 55 : task.impact === "medium" ? 35 : 20;
  if (task.weekly_win) xp += 40;
  if (task.courage_task) xp += 20;
  return xp;
}

function movementXp(health: HealthDay | undefined, workouts: Workout[]): number {
  const steps = health?.steps ?? 0;
  const activeEnergy = health?.active_energy_kcal ?? 0;
  const exercise = health?.exercise_minutes ?? 0;
  const stand = health?.stand_hours ?? 0;
  const mobilityMinutes = workouts
    .filter((workout) => workout.type === "mobility")
    .reduce((sum, workout) => sum + (workout.duration_minutes ?? 0), 0);

  const stepXp = Math.min(40, Math.floor(steps / 1000) * 4);
  const energyXp = Math.min(25, Math.floor(activeEnergy / 100) * 5);
  const exerciseXp = Math.min(40, Math.floor(exercise / 5) * 5);
  const standXp = Math.min(24, stand * 2);
  const mobilityXp = Math.min(25, Math.floor(mobilityMinutes / 5) * 5);
  return stepXp + energyXp + exerciseXp + standXp + mobilityXp;
}

function checkinXp(checkin: DailyCheckin | undefined): number {
  if (!checkin) return 0;
  const morning = 15;
  const evening = checkin.evening_reset_completion === "target"
    ? 20
    : checkin.evening_reset_completion === "floor"
      ? 10
      : 0;
  return morning + evening;
}

function clampProgress(xp: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((xp / target) * 100)));
}

function mondayOf(date: Date): string {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export function themeForSeason(sequence: number): AdventureTheme {
  return (["forest", "coast", "alpine", "aurora"] as const)[Math.abs(sequence - 1) % 4];
}

export function buildAdventureProgress(input: {
  today: string;
  seasonStart: string;
  completedTasks: Task[];
  checkins: DailyCheckin[];
  workouts: Workout[];
  health: HealthDay[];
}): AdventureProgress {
  const byDate = new Map<string, AdventureDayScore>();
  const taskGroups = new Map<string, Task[]>();
  for (const task of input.completedTasks) {
    const date = task.completed_at?.slice(0, 10);
    if (!date) continue;
    taskGroups.set(date, [...(taskGroups.get(date) ?? []), task]);
  }
  const checkinMap = new Map(input.checkins.map((value) => [value.date, value]));
  const healthMap = new Map(input.health.map((value) => [value.date, value]));
  const workoutMap = new Map<string, Workout[]>();
  for (const workout of input.workouts) workoutMap.set(workout.date, [...(workoutMap.get(workout.date) ?? []), workout]);

  const dates = new Set<string>([
    input.today,
    ...taskGroups.keys(),
    ...checkinMap.keys(),
    ...healthMap.keys(),
    ...workoutMap.keys(),
  ]);

  for (const date of dates) {
    const taskPoints = (taskGroups.get(date) ?? []).reduce((sum, task) => sum + taskXp(task), 0);
    const movePoints = movementXp(healthMap.get(date), workoutMap.get(date) ?? []);
    const checkPoints = checkinXp(checkinMap.get(date));
    byDate.set(date, {
      date,
      taskXp: taskPoints,
      movementXp: movePoints,
      checkinXp: checkPoints,
      totalXp: Math.min(260, taskPoints + movePoints + checkPoints),
    });
  }

  const today = byDate.get(input.today) ?? { date: input.today, taskXp: 0, movementXp: 0, checkinXp: 0, totalXp: 0 };
  const now = new Date(`${input.today}T12:00:00`);
  const weekStart = mondayOf(now);
  const monthStart = input.today.slice(0, 7) + "-01";
  const totalXp = Array.from(byDate.values()).filter((day) => day.date >= input.seasonStart && day.date <= input.today).reduce((sum, day) => sum + day.totalXp, 0);
  const weekXp = Array.from(byDate.values()).filter((day) => day.date >= weekStart && day.date <= input.today).reduce((sum, day) => sum + day.totalXp, 0);
  const monthXp = Array.from(byDate.values()).filter((day) => day.date >= monthStart && day.date <= input.today).reduce((sum, day) => sum + day.totalXp, 0);
  const seasonXp = Array.from(byDate.values()).filter((day) => day.date >= input.seasonStart && day.date <= input.today).reduce((sum, day) => sum + day.totalXp, 0);

  return {
    totalXp,
    level: Math.floor(totalXp / LEVEL_XP) + 1,
    xpIntoLevel: totalXp % LEVEL_XP,
    xpForNextLevel: LEVEL_XP,
    today,
    weekXp,
    monthXp,
    seasonXp,
    dayProgress: clampProgress(today.totalXp, DAY_TARGET_XP),
    weekProgress: clampProgress(weekXp, WEEK_TARGET_XP),
    monthProgress: clampProgress(monthXp, MONTH_TARGET_XP),
    seasonProgress: clampProgress(seasonXp, SEASON_TARGET_XP),
  };
}
