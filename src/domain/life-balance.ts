export type RecoverySignal = "low" | "typical" | "high" | "unknown";

export interface HealthSummary {
  date: string;
  steps: number | null;
  active_energy_kcal: number | null;
  exercise_minutes: number | null;
  stand_hours: number | null;
  hrv_sdnn_ms: number | null;
  resting_heart_rate_bpm: number | null;
  sleep_minutes: number | null;
}

export interface LifeMenuOption {
  id: string;
  label: string;
  hint: string;
}

export const LIFE_MENU: LifeMenuOption[] = [
  { id: "outside", label: "Go outside", hint: "Walk, woods, beach, or just get out for a bit." },
  { id: "pool", label: "Go to the pool", hint: "Swim, float, or use the sauna while you're there." },
  { id: "cold-plunge", label: "Cold plunge", hint: "A short reset when it sounds appealing." },
  { id: "mobility", label: "Stretch / mobility", hint: "A few minutes counts; it does not need to become a workout." },
  { id: "masters", label: "Masters swim", hint: "Saturday morning is available when it fits the week." },
  { id: "reset", label: "Unstructured reset", hint: "Read, sit, lie down, or do nothing useful for a while." },
];

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function recoverySignal(today: HealthSummary | null, history: HealthSummary[]): RecoverySignal {
  if (!today) return "unknown";

  const hrvBaseline = median(history.map((d) => d.hrv_sdnn_ms).filter((v): v is number => v != null));
  const rhrBaseline = median(history.map((d) => d.resting_heart_rate_bpm).filter((v): v is number => v != null));

  if (today.hrv_sdnn_ms == null && today.resting_heart_rate_bpm == null) return "unknown";

  let score = 0;
  let evidence = 0;

  if (today.hrv_sdnn_ms != null && hrvBaseline != null && hrvBaseline > 0) {
    const ratio = today.hrv_sdnn_ms / hrvBaseline;
    if (ratio < 0.85) score -= 1;
    else if (ratio > 1.15) score += 1;
    evidence += 1;
  }

  if (today.resting_heart_rate_bpm != null && rhrBaseline != null && rhrBaseline > 0) {
    const ratio = today.resting_heart_rate_bpm / rhrBaseline;
    if (ratio > 1.08) score -= 1;
    else if (ratio < 0.94) score += 1;
    evidence += 1;
  }

  if (evidence === 0) return "unknown";
  if (score < 0) return "low";
  if (score > 0) return "high";
  return "typical";
}

export function movementSignal(summary: HealthSummary | null): string {
  if (!summary) return "No Apple Health data yet";
  const parts: string[] = [];
  if (summary.steps != null) parts.push(`${summary.steps.toLocaleString()} steps`);
  if (summary.exercise_minutes != null) parts.push(`${summary.exercise_minutes} exercise min`);
  if (summary.stand_hours != null) parts.push(`${summary.stand_hours} stand hr`);
  if (summary.active_energy_kcal != null) parts.push(`${Math.round(summary.active_energy_kcal)} active kcal`);
  return parts.length ? parts.join(" · ") : "Apple Health connected; today's movement is still sparse";
}

export function recoveryCopy(signal: RecoverySignal): string {
  switch (signal) {
    case "low":
      return "Recovery signals look lower than your recent baseline. Treat that as a hint to leave more room, not as a diagnosis.";
    case "high":
      return "Recovery signals look stronger than your recent baseline. You may have a little more room, but your calendar still matters.";
    case "typical":
      return "Recovery signals look close to your recent baseline.";
    default:
      return "Not enough recent HRV/resting-heart-rate data to estimate recovery yet.";
  }
}
