import type { SupabaseClient } from "@supabase/supabase-js";

export type HealthSummaryInput = {
  date: string;
  steps?: number | null;
  activeEnergyKcal?: number | null;
  exerciseMinutes?: number | null;
  standHours?: number | null;
  hrvSdnnMs?: number | null;
  restingHeartRateBpm?: number | null;
  sleepMinutes?: number | null;
  observedAt?: string;
};

export async function upsertHealthSummaries(client: SupabaseClient, userId: string, summaries: HealthSummaryInput[]): Promise<void> {
  const results = await Promise.all(summaries.map((summary) => {
    const values = Object.fromEntries(Object.entries({
      steps: summary.steps,
      active_energy_kcal: summary.activeEnergyKcal,
      exercise_minutes: summary.exerciseMinutes,
      stand_hours: summary.standHours,
      hrv_sdnn_ms: summary.hrvSdnnMs,
      resting_heart_rate_bpm: summary.restingHeartRateBpm,
      sleep_minutes: summary.sleepMinutes,
    }).filter(([, value]) => value != null));
    return client.rpc("upsert_health_daily_summary", {
      p_user_id: userId,
      p_date: summary.date,
      p_source: "apple_health",
      p_values: values,
      p_observed_at: summary.observedAt ?? null,
    });
  }));
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}
