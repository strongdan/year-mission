import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const healthKitWorkoutTypeSchema = z.enum([
  "lifting",
  "walking",
  "running",
  "cycling",
  "swimming",
  "mobility",
  "other",
]);

export const healthKitDailyMetricSchema = z.object({
  date: dateSchema,
  steps: z.number().int().min(0).max(200_000).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  weightLb: z.number().min(50).max(1_500).optional(),
});

export const healthKitWorkoutSchema = z.object({
  id: z.string().min(1).max(200),
  date: dateSchema,
  type: healthKitWorkoutTypeSchema,
  durationMinutes: z.number().positive().max(24 * 60),
  energyKcal: z.number().min(0).max(20_000).optional(),
  distanceMiles: z.number().min(0).max(1_000).optional(),
});

export const healthKitSyncSchema = z.object({
  source: z.literal("healthkit").default("healthkit"),
  generatedAt: z.string().datetime().optional(),
  daily: z.array(healthKitDailyMetricSchema).max(31).default([]),
  workouts: z.array(healthKitWorkoutSchema).max(200).default([]),
});

export type HealthKitSyncPayload = z.infer<typeof healthKitSyncSchema>;

export interface HealthCheckinLike {
  date: string;
  steps?: number | null;
  sleep_hours?: number | string | null;
  weight?: number | string | null;
}

export interface HealthWorkoutLike {
  date: string;
  duration_minutes?: number | null;
  metadata?: unknown;
}

export interface HealthWindow {
  daysWithSteps: number;
  averageSteps: number | null;
  daysWithSleep: number;
  averageSleepHours: number | null;
  workoutCount: number;
  workoutMinutes: number;
}

export interface HealthAdaptation {
  suggestedMode: "normal" | "maintenance" | "recovery";
  confidence: "low" | "medium";
  reason: string;
  requiresApproval: true;
}

export interface HealthSummary {
  asOf: string;
  latestWeightLb: number | null;
  recent7Days: HealthWindow;
  previous7Days: HealthWindow;
  changes: {
    sleepHours: number | null;
    stepsPercent: number | null;
    workoutMinutesPercent: number | null;
  };
  adaptation: HealthAdaptation;
}

function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function finiteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function summarizeWindow(
  checkins: HealthCheckinLike[],
  workouts: HealthWorkoutLike[],
  start: string,
  end: string
): HealthWindow {
  const inWindow = (date: string) => date >= start && date <= end;
  const windowCheckins = checkins.filter((checkin) => inWindow(checkin.date));
  const windowWorkouts = workouts.filter((workout) => inWindow(workout.date));
  const steps = windowCheckins
    .map((checkin) => finiteNumber(checkin.steps))
    .filter((value): value is number => value !== null);
  const sleep = windowCheckins
    .map((checkin) => finiteNumber(checkin.sleep_hours))
    .filter((value): value is number => value !== null);

  return {
    daysWithSteps: steps.length,
    averageSteps: average(steps),
    daysWithSleep: sleep.length,
    averageSleepHours: average(sleep),
    workoutCount: windowWorkouts.length,
    workoutMinutes: windowWorkouts.reduce(
      (sum, workout) => sum + Math.max(0, finiteNumber(workout.duration_minutes) ?? 0),
      0
    ),
  };
}

function buildAdaptation(
  recent: HealthWindow,
  previous: HealthWindow,
  sleepChange: number | null,
  stepsChange: number | null,
  workoutMinutesChange: number | null
): HealthAdaptation {
  const enoughSleepData = recent.daysWithSleep >= 4 && previous.daysWithSleep >= 4;
  const confidence: HealthAdaptation["confidence"] = enoughSleepData ? "medium" : "low";

  if (
    enoughSleepData &&
    sleepChange !== null &&
    sleepChange <= -0.75 &&
    (workoutMinutesChange === null || workoutMinutesChange >= 10)
  ) {
    return {
      suggestedMode: "recovery",
      confidence,
      reason:
        "Sleep is materially below the prior week while training load is not lower. Favor recovery and smaller commitments until the trend stabilizes.",
      requiresApproval: true,
    };
  }

  if (
    (enoughSleepData && sleepChange !== null && sleepChange <= -0.4) ||
    (stepsChange !== null && stepsChange <= -30)
  ) {
    return {
      suggestedMode: "maintenance",
      confidence,
      reason:
        "Recent activity or sleep has dropped versus the prior week. Preserve the minimum viable routine instead of increasing load.",
      requiresApproval: true,
    };
  }

  return {
    suggestedMode: "normal",
    confidence,
    reason:
      recent.daysWithSleep + recent.daysWithSteps < 4
        ? "There is not enough recent HealthKit coverage to justify changing the plan."
        : "Recent wellness and activity signals do not justify reducing the current plan.",
    requiresApproval: true,
  };
}

export function buildHealthSummary(
  checkins: HealthCheckinLike[],
  workouts: HealthWorkoutLike[],
  asOf = new Date().toISOString().slice(0, 10)
): HealthSummary {
  const recent = summarizeWindow(checkins, workouts, shiftDate(asOf, -6), asOf);
  const previous = summarizeWindow(checkins, workouts, shiftDate(asOf, -13), shiftDate(asOf, -7));
  const sleepChange =
    recent.averageSleepHours === null || previous.averageSleepHours === null
      ? null
      : recent.averageSleepHours - previous.averageSleepHours;
  const stepsChange = percentChange(recent.averageSteps, previous.averageSteps);
  const workoutMinutesChange = percentChange(recent.workoutMinutes, previous.workoutMinutes);

  const latestWeightLb = checkins
    .filter((checkin) => checkin.date <= asOf && finiteNumber(checkin.weight) !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((checkin) => finiteNumber(checkin.weight))[0] ?? null;

  return {
    asOf,
    latestWeightLb,
    recent7Days: recent,
    previous7Days: previous,
    changes: {
      sleepHours: sleepChange,
      stepsPercent: stepsChange,
      workoutMinutesPercent: workoutMinutesChange,
    },
    adaptation: buildAdaptation(recent, previous, sleepChange, stepsChange, workoutMinutesChange),
  };
}
