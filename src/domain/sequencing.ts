import type { Task } from "@/types/models";
import type { WeekMode } from "./constants";
import { taskWeight, sizeFromMinutes } from "./task-weight";

export type EnergyLevel = "low" | "medium" | "high";

export const SEQUENCE_TIERS = {
  weeklyWin: 1,
  timeSensitive: 2,
  monthlyFocus: 3,
  bigFour: 4,
  deferred: 5,
  other: 6,
} as const;

export type SequenceTier = (typeof SEQUENCE_TIERS)[keyof typeof SEQUENCE_TIERS];

const SOON_DAYS = 3;
const DEEP_MINUTES = 60;

export interface SequenceInput {
  candidates: Task[];
  now?: Date;
  weeklyWinTaskIds?: string[];
  monthlyFocusDomainIds?: string[];
  monthlyFocusTitle?: string | null;
  bigFourOpenSlugs?: string[];
  bigFourProgress?: Record<string, { done: number; target: number }>;
  blockedTaskIds?: string[];
  availableMinutes?: number | null;
  energy?: EnergyLevel | null;
  weekMode?: WeekMode;
  excludeTaskId?: string | null;
}

export interface SequenceReason {
  code:
    | "weekly_win"
    | "due_soon"
    | "overdue"
    | "monthly_focus"
    | "big_four"
    | "deferred"
    | "fits_time"
    | "no_blocker"
    | "good_energy";
  label: string;
}

export interface RecommendedTask {
  task: Task;
  tier: SequenceTier;
  reasons: SequenceReason[];
}

export interface FloorSuggestion {
  kind: "floor";
  label: string;
  minutes: number;
  reason: string;
}

export type SequenceResult = { kind: "task"; task: RecommendedTask } | FloorSuggestion;

export const FLOORS: Record<string, { label: string; minutes: number }> = {
  body: { label: "10-minute walk", minutes: 10 },
  home: { label: "10 minutes of physical Home work", minutes: 10 },
  capability: { label: "One concrete technical action", minutes: 15 },
  money: { label: "One small money review action", minutes: 10 },
};

const FLOOR_ORDER = ["body", "home", "capability", "money"] as const;

function startOfDayUTC(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysUntil(dateStr: string | null, now: Date): number | null {
  if (!dateStr || dateStr.length < 10) return null;
  const target = Date.UTC(Number(dateStr.slice(0, 4)), Number(dateStr.slice(5, 7)) - 1, Number(dateStr.slice(8, 10)));
  return Math.round((target - startOfDayUTC(now)) / 86_400_000);
}

function isTimeSensitive(task: Task, now: Date): boolean {
  const due = daysUntil(task.due_date, now);
  return due !== null && due <= SOON_DAYS;
}

function isDeep(task: Task): boolean {
  return (task.estimated_minutes ?? 0) > DEEP_MINUTES;
}

function fitsAvailableTime(task: Task, minutes: number): boolean {
  if (task.estimated_minutes === null) return true;
  return task.estimated_minutes <= minutes;
}

function score(task: Task): number {
  const size = sizeFromMinutes(task.estimated_minutes);
  return taskWeight({ impact: task.impact, size, courage: task.courage_task, metaWork: task.meta_work }) + task.defer_count;
}

function domainLabel(slug: string): string {
  return slug === "capability" ? "Career" : slug;
}

function pickFloor(bigFourOpenSlugs: string[] | undefined, reason: string): FloorSuggestion {
  for (const slug of FLOOR_ORDER) {
    if (bigFourOpenSlugs?.includes(slug)) {
      const floor = FLOORS[slug];
      return { kind: "floor", label: floor.label, minutes: floor.minutes, reason };
    }
  }
  return { kind: "floor", label: "10-minute walk, no alcohol, one useful action", minutes: 10, reason };
}

function assess(
  task: Task,
  input: SequenceInput,
  now: Date,
  winIds: Set<string>,
  focusDomainIds: Set<string>,
  openSlugs: Set<string>,
  blocked: Set<string>
): { tier: SequenceTier; reasons: SequenceReason[] } {
  const reasons: SequenceReason[] = [];
  let tier: SequenceTier = SEQUENCE_TIERS.other;

  if (winIds.has(task.id)) {
    tier = Math.min(tier, SEQUENCE_TIERS.weeklyWin) as SequenceTier;
    reasons.push({ code: "weekly_win", label: "It advances this week's Weekly Win." });
  }

  if (isTimeSensitive(task, now)) {
    const due = daysUntil(task.due_date, now);
    tier = Math.min(tier, SEQUENCE_TIERS.timeSensitive) as SequenceTier;
    if (due !== null && due < 0) {
      reasons.push({ code: "overdue", label: `It is overdue (was due ${task.due_date}).` });
    } else {
      reasons.push({ code: "due_soon", label: `It is due soon (${task.due_date}).` });
    }
  }

  if (task.domain_id && focusDomainIds.has(task.domain_id)) {
    tier = Math.min(tier, SEQUENCE_TIERS.monthlyFocus) as SequenceTier;
    reasons.push({
      code: "monthly_focus",
      label: `It advances this month's focus — ${input.monthlyFocusTitle ?? "your current focus"}.`,
    });
  }

  if (task.domain?.slug && openSlugs.has(task.domain.slug)) {
    tier = Math.min(tier, SEQUENCE_TIERS.bigFour) as SequenceTier;
    const progress = input.bigFourProgress?.[task.domain.slug];
    const detail = progress ? ` (${progress.done}/${progress.target} done)` : "";
    reasons.push({ code: "big_four", label: `It fills an open Big Four commitment (${domainLabel(task.domain.slug)})${detail}.` });
  }

  if (task.defer_count >= 2) {
    tier = Math.min(tier, SEQUENCE_TIERS.deferred) as SequenceTier;
  }
  if (task.defer_count >= 1) {
    reasons.push({
      code: "deferred",
      label: `You've deferred it ${task.defer_count} time${task.defer_count === 1 ? "" : "s"}.`,
    });
  }

  if (input.availableMinutes != null && fitsAvailableTime(task, input.availableMinutes)) {
    reasons.push({ code: "fits_time", label: `It fits the ${input.availableMinutes} minutes you have.` });
  }
  if (!blocked.has(task.id)) {
    reasons.push({ code: "no_blocker", label: "It has no blocker." });
  }
  if (input.energy && input.energy !== "low" && !isDeep(task)) {
    reasons.push({ code: "good_energy", label: "It's a reasonable size for your current energy." });
  }

  return { tier, reasons };
}

export function sequenceTasks(input: SequenceInput): SequenceResult {
  const now = input.now ?? new Date();
  const weekMode = input.weekMode ?? "normal";
  const winIds = new Set([
    ...(input.weeklyWinTaskIds ?? []),
    ...input.candidates.filter((t) => t.weekly_win).map((t) => t.id),
  ]);
  const focusDomainIds = new Set(input.monthlyFocusDomainIds ?? []);
  const openSlugs = new Set(input.bigFourOpenSlugs ?? []);
  const blocked = new Set(input.blockedTaskIds ?? []);

  let pool = input.candidates.filter((t) => t.status !== "completed" && t.status !== "dropped");
  if (input.excludeTaskId) pool = pool.filter((t) => t.id !== input.excludeTaskId);

  // Blockers exclude a task regardless of priority.
  pool = pool.filter((t) => !blocked.has(t.id));

  if (pool.length === 0) {
    return pickFloor(input.bigFourOpenSlugs, "No active task is actionable right now. A floor keeps the day moving.");
  }

  // Maintenance weeks protect only the core system; nothing new beyond it.
  if (weekMode === "maintenance") {
    pool = pool.filter((t) => {
      if (winIds.has(t.id)) return true;
      if (isTimeSensitive(t, now)) return true;
      if (t.domain_id && focusDomainIds.has(t.domain_id)) return true;
      if (t.domain?.slug && openSlugs.has(t.domain.slug)) return true;
      return false;
    });
    if (pool.length === 0) {
      return pickFloor(input.bigFourOpenSlugs, "In maintenance mode, protect the core. A floor keeps continuity without adding load.");
    }
  }

  if (input.availableMinutes != null) {
    const minutes = input.availableMinutes;
    const fits = pool.filter((t) => fitsAvailableTime(t, minutes));
    if (fits.length === 0) {
      return pickFloor(input.bigFourOpenSlugs, `Nothing fits ${minutes} minutes right now.`);
    }
    pool = fits;
  }

  if (input.energy === "low" || weekMode === "recovery") {
    pool = pool.filter((t) => !isDeep(t));
  }

  if (pool.length === 0) {
    return pickFloor(input.bigFourOpenSlugs, "No active task fits right now. A floor keeps the day moving.");
  }

  const ranked = pool.map((task) => {
    const { tier, reasons } = assess(task, input, now, winIds, focusDomainIds, openSlugs, blocked);
    return { task, tier, reasons };
  });

  ranked.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    const scoreDiff = score(b.task) - score(a.task);
    if (scoreDiff !== 0) return scoreDiff;
    const aDue = a.task.due_date ?? a.task.scheduled_date;
    const bDue = b.task.due_date ?? b.task.scheduled_date;
    const aUrgent = aDue ? (daysUntil(aDue, now) ?? 0) <= SOON_DAYS : false;
    const bUrgent = bDue ? (daysUntil(bDue, now) ?? 0) <= SOON_DAYS : false;
    if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;
    if (aUrgent && bUrgent && aDue && bDue) return aDue.localeCompare(bDue);
    return b.task.defer_count - a.task.defer_count;
  });

  return { kind: "task", task: ranked[0] };
}
