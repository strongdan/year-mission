import type { DomainSlug, WeekMode } from "./constants";

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

export type CategoryMomentumTrend = "rising" | "steady" | "quieter";
export type CategoryMomentumRelative = "leading" | "near_average" | "quieter";

export interface CategoryMomentum {
  slug: DomainSlug;
  score: number | null;
  recentUnits: number;
  previousUnits: number;
  weeklyTarget: number;
  trend: CategoryMomentumTrend;
  relative: CategoryMomentumRelative | null;
  deltaFromAverage: number | null;
}

export interface CategoryMomentumInput {
  recentUnits: Record<DomainSlug, number>;
  previousUnits: Record<DomainSlug, number>;
  weeklyTargets: Record<DomainSlug, number>;
}

const BIG_FOUR_WEIGHT = 60;
const TASKS_WEIGHT = 25;
const MIN_DAY_WEIGHT = 15;
const MILESTONE_BONUS = 10;
const CATEGORY_ORDER: DomainSlug[] = ["body", "money", "home", "capability"];
const RECENT_CATEGORY_WEIGHT = 0.72;
const PREVIOUS_CATEGORY_WEIGHT = 0.28;
const TREND_PACE_THRESHOLD = 0.25;
const RELATIVE_SCORE_THRESHOLD = 12;

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

function pace(units: number, weeklyTarget: number): number {
  if (weeklyTarget <= 0) return 0;
  return Math.max(0, units) / weeklyTarget;
}

function categoryScore(recentUnits: number, previousUnits: number, weeklyTarget: number): number {
  const recentPace = Math.min(1, pace(recentUnits, weeklyTarget));
  const previousPace = Math.min(1, pace(previousUnits, weeklyTarget));
  return Math.round((recentPace * RECENT_CATEGORY_WEIGHT + previousPace * PREVIOUS_CATEGORY_WEIGHT) * 100);
}

function categoryTrend(recentUnits: number, previousUnits: number, weeklyTarget: number): CategoryMomentumTrend {
  const delta = pace(recentUnits, weeklyTarget) - pace(previousUnits, weeklyTarget);
  if (delta >= TREND_PACE_THRESHOLD) return "rising";
  if (delta <= -TREND_PACE_THRESHOLD) return "quieter";
  return "steady";
}

/**
 * Category momentum compares the last rolling seven days with the seven days
 * before them. It uses each category's weekly floor as the pace denominator,
 * then compares every category with the user's own four-category average.
 *
 * This is intentionally not a streak. A quiet category can recover in one
 * meaningful rep and the previous week still contributes 28% of the score.
 */
export function computeCategoryMomentum(input: CategoryMomentumInput): CategoryMomentum[] {
  const totalSignal = CATEGORY_ORDER.reduce(
    (sum, slug) => sum + Math.max(0, input.recentUnits[slug]) + Math.max(0, input.previousUnits[slug]),
    0,
  );

  if (totalSignal <= 0) {
    return CATEGORY_ORDER.map((slug) => ({
      slug,
      score: null,
      recentUnits: 0,
      previousUnits: 0,
      weeklyTarget: input.weeklyTargets[slug],
      trend: "steady",
      relative: null,
      deltaFromAverage: null,
    }));
  }

  const base = CATEGORY_ORDER.map((slug) => ({
    slug,
    score: categoryScore(input.recentUnits[slug], input.previousUnits[slug], input.weeklyTargets[slug]),
    recentUnits: Math.max(0, input.recentUnits[slug]),
    previousUnits: Math.max(0, input.previousUnits[slug]),
    weeklyTarget: input.weeklyTargets[slug],
    trend: categoryTrend(input.recentUnits[slug], input.previousUnits[slug], input.weeklyTargets[slug]),
  }));
  const average = base.reduce((sum, item) => sum + item.score, 0) / base.length;

  return base.map((item) => {
    const deltaFromAverage = Math.round(item.score - average);
    const relative: CategoryMomentumRelative = deltaFromAverage >= RELATIVE_SCORE_THRESHOLD
      ? "leading"
      : deltaFromAverage <= -RELATIVE_SCORE_THRESHOLD
        ? "quieter"
        : "near_average";
    return { ...item, relative, deltaFromAverage };
  });
}

export function momentumLabel(score: number | null): string {
  if (score === null) return "No data yet";
  if (score >= 75) return "Strong";
  if (score >= 50) return "Steady";
  if (score >= 25) return "Rebuilding";
  return "Starting";
}
