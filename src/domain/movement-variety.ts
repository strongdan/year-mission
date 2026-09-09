export const MOVEMENT_OPTIONS = [
  { id: "swim", label: "Pool / swim", short: "Swim" },
  { id: "skate", label: "Skate / hockey", short: "Skate" },
  { id: "hike", label: "Go for a hike", short: "Hike" },
  { id: "run", label: "Go for a run", short: "Run" },
  { id: "bike", label: "Go for a bike ride", short: "Bike" },
  { id: "walk", label: "Go for a walk", short: "Walk" },
  { id: "other", label: "Something else active", short: "Other" },
] as const;

export type MovementActivity = (typeof MOVEMENT_OPTIONS)[number]["id"];

export interface MovementLogLike {
  activity: MovementActivity;
  happenedOn: string;
}

export interface MovementOptionStatus {
  id: MovementActivity;
  label: string;
  short: string;
  lastDoneOn: string | null;
  daysSince: number | null;
}

export interface MovementSnapshot {
  daysSinceAny: number | null;
  lastAnyOn: string | null;
  overdue: boolean;
  recommendation: MovementOptionStatus;
  options: MovementOptionStatus[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toUtcDay(value: string): number | null {
  if (!DATE_RE.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const ms = Date.UTC(year, month - 1, day);
  return Number.isFinite(ms) ? ms : null;
}

export function daysBetweenDates(earlier: string, later: string): number | null {
  const start = toUtcDay(earlier);
  const end = toUtcDay(later);
  if (start === null || end === null) return null;
  return Math.max(0, Math.floor((end - start) / 86_400_000));
}

export function buildMovementSnapshot(
  logs: MovementLogLike[],
  today: string,
  nudgeAfterDays = 2
): MovementSnapshot {
  const latestByActivity = new Map<MovementActivity, string>();
  let lastAnyOn: string | null = null;

  for (const log of logs) {
    if (!DATE_RE.test(log.happenedOn)) continue;
    const existing = latestByActivity.get(log.activity);
    if (!existing || log.happenedOn > existing) latestByActivity.set(log.activity, log.happenedOn);
    if (!lastAnyOn || log.happenedOn > lastAnyOn) lastAnyOn = log.happenedOn;
  }

  const options: MovementOptionStatus[] = MOVEMENT_OPTIONS.map((option) => {
    const lastDoneOn = latestByActivity.get(option.id) ?? null;
    return {
      ...option,
      lastDoneOn,
      daysSince: lastDoneOn ? daysBetweenDates(lastDoneOn, today) : null,
    };
  });

  const daysSinceAny = lastAnyOn ? daysBetweenDates(lastAnyOn, today) : null;
  const overdue = daysSinceAny === null || daysSinceAny >= Math.max(1, nudgeAfterDays);

  // Variety wins ties: pool, skating, hiking, running, biking, then walking.
  // "Other" is always available but never becomes the primary suggestion by itself.
  const eligible = options.filter((option) => option.id !== "other");
  const recommendation = eligible.reduce((best, option) => {
    if (best.daysSince === null && option.daysSince !== null) return best;
    if (option.daysSince === null && best.daysSince !== null) return option;
    if (best.daysSince === null && option.daysSince === null) return best;
    return (option.daysSince ?? 0) > (best.daysSince ?? 0) ? option : best;
  }, eligible[0]);

  return { daysSinceAny, lastAnyOn, overdue, recommendation, options };
}

export function movementRecencyLabel(daysSince: number | null): string {
  if (daysSince === null) return "not lately";
  if (daysSince === 0) return "today";
  if (daysSince === 1) return "yesterday";
  return `${daysSince}d ago`;
}
