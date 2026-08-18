import type { TaskSize } from "./constants";

export function sizeFromMinutes(minutes: number | null): TaskSize {
  if (minutes === null) return "standard";
  if (minutes <= 15) return "quick";
  if (minutes <= 60) return "standard";
  return "deep";
}

export const IMPACT_WEIGHT = { low: 1, medium: 2, high: 3 } as const;
export const COURAGE_BONUS = 1.5;
export const META_WORK_MULTIPLIER = 0;
export const SIZING_WEIGHT = { quick: 1, standard: 2, deep: 3, milestone: 4 } as const;

export interface TaskWeightInput {
  impact: "low" | "medium" | "high";
  size: TaskSize;
  courage?: boolean;
  metaWork?: boolean;
}

/**
 * Meaningful-task weight. Five trivial tasks should not outscore one
 * consequential task. Meta-work earns no momentum.
 */
export function taskWeight({ impact, size, courage = false, metaWork = false }: TaskWeightInput): number {
  if (metaWork) return META_WORK_MULTIPLIER;
  const base = IMPACT_WEIGHT[impact] * SIZING_WEIGHT[size];
  return Math.round(base * (courage ? COURAGE_BONUS : 1));
}

export function isMilestone(size: TaskSize): boolean {
  return size === "milestone";
}