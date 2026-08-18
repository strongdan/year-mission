import type { WeekMode } from "./constants";

export interface DayActivity {
  date: string;
  bigFourCompleted: number;
  meaningfulTasksCompleted: number;
  minimumDayMet: boolean;
  milestone?: boolean;
  weekMode?: WeekMode;
}

export interface MomentumInput {
  days: DayActivity[];
  windowDays?: number;
}

const BIG_FOUR_WEIGHT = 60;
const TASKS_WEIGHT = 25;
const MIN_DAY_WEIGHT = 15;
const MILESTONE_BONUS = 10;

export function dayScore(d: DayActivity): number {
  const bigFour = Math.max(0, Math.min(4, d.bigFourCompleted)) / 4 * BIG_FOUR_WEIGHT;
  const tasks = Math.min(5, Math.max(0, d.meaningfulTasksCompleted)) / 5 * TASKS_WEIGHT;
  const minDay = d.minimumDayMet ? MIN_DAY_WEIGHT : 0;
  const milestone = d.milestone ? MILESTONE_BONUS : 0;
  return Math.max(0, Math.min(100, bigFour + tasks + minDay + milestone));
}

export function weightedRecentAverage(values: number[], alpha: number): number {
  const n = values.length;
  if (n === 0) return 0;
  let weightedSum = 0;
  let weightSum = 0;
  for (let i = 0; i < n; i++) {
    const weight = alpha * Math.pow(1 - alpha, n - 1 - i);
    weightedSum += values[i] * weight;
    weightSum += weight;
  }
  return weightSum === 0 ? values[n - 1] : weightedSum / weightSum;
}

/**
 * Rolling 0-100 momentum. Recent days are weighted more heavily so momentum
 * recovers quickly after disruption and never "resets" on a single missed day.
 */
export function computeMomentum({ days, windowDays = 14 }: MomentumInput): number | null {
  const windowed = days.slice(-windowDays);
  if (windowed.length === 0) return null;
  const scores = windowed.map(dayScore);
  const alpha = 2 / (Math.min(windowDays, scores.length) + 1);
  return Math.round(weightedRecentAverage(scores, alpha));
}

export function momentumLabel(score: number | null): string {
  if (score === null) return "No data yet";
  if (score >= 75) return "Strong";
  if (score >= 50) return "Steady";
  if (score >= 25) return "Rebuilding";
  return "Starting";
}
