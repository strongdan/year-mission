import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildHealthSummary,
  healthKitSyncSchema,
  type HealthKitSyncPayload,
  type HealthSummary,
} from "@/domain/health";

function healthkitId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>).healthkitId;
  return typeof value === "string" ? value : null;
}

export async function syncHealthKitForUser(
  admin: SupabaseClient,
  userId: string,
  input: unknown
): Promise<{ dailyUpserts: number; workoutsInserted: number; workoutsSkipped: number }> {
  const payload: HealthKitSyncPayload = healthKitSyncSchema.parse(input);
  let dailyUpserts = 0;

  for (const day of payload.daily) {
    const patch: Record<string, unknown> = { user_id: userId, date: day.date };
    if (day.steps !== undefined) patch.steps = day.steps;
    if (day.sleepHours !== undefined) patch.sleep_hours = Number(day.sleepHours.toFixed(2));

    if (day.weightLb !== undefined) {
      const { data: existing, error: existingError } = await admin
        .from("daily_checkins")
        .select("weight")
        .eq("user_id", userId)
        .eq("date", day.date)
        .maybeSingle();
      if (existingError) throw new Error(existingError.message);
      if (existing?.weight === null || existing?.weight === undefined) {
        patch.weight = Number(day.weightLb.toFixed(1));
      }
    }

    const { error } = await admin
      .from("daily_checkins")
      .upsert(patch, { onConflict: "user_id,date" });
    if (error) throw new Error(error.message);
    dailyUpserts += 1;
  }

  const earliestWorkoutDate = payload.workouts
    .map((workout) => workout.date)
    .sort()[0];
  const existingIds = new Set<string>();
  if (earliestWorkoutDate) {
    const { data, error } = await admin
      .from("workouts")
      .select("metadata")
      .eq("user_id", userId)
      .gte("date", earliestWorkoutDate)
      .limit(500);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      const id = healthkitId(row.metadata);
      if (id) existingIds.add(id);
    }
  }

  const newWorkouts = payload.workouts
    .filter((workout) => !existingIds.has(workout.id))
    .map((workout) => ({
      user_id: userId,
      date: workout.date,
      type: workout.type,
      duration_minutes: Math.max(1, Math.round(workout.durationMinutes)),
      notes: null,
      metadata: {
        source: "healthkit",
        healthkitId: workout.id,
        ...(workout.energyKcal === undefined ? {} : { energyKcal: workout.energyKcal }),
        ...(workout.distanceMiles === undefined ? {} : { distanceMiles: workout.distanceMiles }),
      },
    }));

  if (newWorkouts.length > 0) {
    const { error } = await admin.from("workouts").insert(newWorkouts);
    if (error) throw new Error(error.message);
  }

  return {
    dailyUpserts,
    workoutsInserted: newWorkouts.length,
    workoutsSkipped: payload.workouts.length - newWorkouts.length,
  };
}

function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export async function getHealthSummaryForUser(
  admin: SupabaseClient,
  userId: string,
  asOf = new Date().toISOString().slice(0, 10)
): Promise<HealthSummary> {
  const fromDate = shiftDate(asOf, -13);
  const [checkinsResult, workoutsResult] = await Promise.all([
    admin
      .from("daily_checkins")
      .select("date, steps, sleep_hours, weight")
      .eq("user_id", userId)
      .gte("date", fromDate)
      .lte("date", asOf)
      .order("date"),
    admin
      .from("workouts")
      .select("date, duration_minutes, metadata")
      .eq("user_id", userId)
      .gte("date", fromDate)
      .lte("date", asOf)
      .order("date"),
  ]);

  if (checkinsResult.error) throw new Error(checkinsResult.error.message);
  if (workoutsResult.error) throw new Error(workoutsResult.error.message);
  return buildHealthSummary(checkinsResult.data ?? [], workoutsResult.data ?? [], asOf);
}
