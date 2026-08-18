import type { WeekMode } from "./constants";

export interface WipLimits {
  todayMax: number;
  weekMax: number;
  activeExperimentsMax: number;
  courageTasksMax: number;
  wellnessTarget: number;
}

export const WIP_LIMITS: Record<WeekMode, WipLimits> = {
  push: { todayMax: 6, weekMax: 14, activeExperimentsMax: 2, courageTasksMax: 1, wellnessTarget: 3 },
  normal: { todayMax: 5, weekMax: 12, activeExperimentsMax: 2, courageTasksMax: 1, wellnessTarget: 3 },
  maintenance: { todayMax: 3, weekMax: 8, activeExperimentsMax: 2, courageTasksMax: 1, wellnessTarget: 2 },
  recovery: { todayMax: 2, weekMax: 5, activeExperimentsMax: 2, courageTasksMax: 1, wellnessTarget: 2 },
};

export const DEFAULT_WEEK_MODE: WeekMode = "normal";

export type AddDecision =
  | { allowed: true }
  | { allowed: false; reason: "today_full" | "week_full" | "courage_full" | "experiments_full" };

export function canAddToToday(currentTodayCount: number, mode: WeekMode = "normal"): AddDecision {
  if (currentTodayCount >= WIP_LIMITS[mode].todayMax) {
    return { allowed: false, reason: "today_full" };
  }
  return { allowed: true };
}

export function canAddToWeek(currentWeekCount: number, mode: WeekMode = "normal"): AddDecision {
  if (currentWeekCount >= WIP_LIMITS[mode].weekMax) {
    return { allowed: false, reason: "week_full" };
  }
  return { allowed: true };
}

export function canAddCourageTask(currentCourageCount: number): AddDecision {
  if (currentCourageCount >= WIP_LIMITS.normal.courageTasksMax) {
    return { allowed: false, reason: "courage_full" };
  }
  return { allowed: true };
}

export function canActivateExperiment(activeCount: number, maxActive = WIP_LIMITS.normal.activeExperimentsMax): AddDecision {
  if (activeCount >= maxActive) {
    return { allowed: false, reason: "experiments_full" };
  }
  return { allowed: true };
}