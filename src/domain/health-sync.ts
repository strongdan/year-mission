export type HealthSummaryValues = {
  steps: number | null;
  active_energy_kcal: number | null;
  exercise_minutes: number | null;
  stand_hours: number | null;
  hrv_sdnn_ms: number | null;
  resting_heart_rate_bpm: number | null;
  sleep_minutes: number | null;
  observed_at: string | null;
};

export type IncomingHealthSummary = Partial<HealthSummaryValues> & { observed_at?: string };

/** Merge a partial observation without treating omitted/null metrics as deletions. */
export function mergeHealthSummary(existing: HealthSummaryValues | null | undefined, incoming: IncomingHealthSummary, fallbackObservedAt: string): HealthSummaryValues {
  return {
    steps: incoming.steps ?? existing?.steps ?? null,
    active_energy_kcal: incoming.active_energy_kcal ?? existing?.active_energy_kcal ?? null,
    exercise_minutes: incoming.exercise_minutes ?? existing?.exercise_minutes ?? null,
    stand_hours: incoming.stand_hours ?? existing?.stand_hours ?? null,
    hrv_sdnn_ms: incoming.hrv_sdnn_ms ?? existing?.hrv_sdnn_ms ?? null,
    resting_heart_rate_bpm: incoming.resting_heart_rate_bpm ?? existing?.resting_heart_rate_bpm ?? null,
    sleep_minutes: incoming.sleep_minutes ?? existing?.sleep_minutes ?? null,
    observed_at: incoming.observed_at ?? existing?.observed_at ?? fallbackObservedAt,
  };
}
