import type { Task } from "@/types/models";

export type ChargeTier = "ready" | "ignited" | "in_motion" | "day_won" | "full_charge";

export interface ChargeState {
  charge: number;
  tier: ChargeTier;
  label: string;
  meaningfulActions: number;
  protectedAreas: number;
  nextTarget: number | null;
  pointsToNext: number;
}

export interface BonusMission {
  slug: string;
  label: string;
  done: number;
  target: number;
}

export interface ComebackState {
  active: boolean;
  quietDays: number;
}

export interface MissionAchievement {
  id: "first_spark" | "four_corners" | "courage" | "comeback" | "weekly_win" | "milestone" | "long_game";
  title: string;
  description: string;
  earned: boolean;
  progress: number;
  target: number;
}

type GameTask = Pick<Task, "impact" | "courage_task" | "weekly_win" | "meta_work">;
type WeeklyValue = { done: number; target: number };

const DOMAIN_ORDER = ["body", "money", "home", "capability"] as const;
const DOMAIN_LABELS: Record<string, string> = {
  body: "Body",
  money: "Money",
  home: "Self",
  capability: "Career",
};

const TIERS: Array<{ threshold: number; tier: ChargeTier; label: string }> = [
  { threshold: 100, tier: "full_charge", label: "Full charge" },
  { threshold: 80, tier: "day_won", label: "Day won" },
  { threshold: 50, tier: "in_motion", label: "In motion" },
  { threshold: 20, tier: "ignited", label: "Ignited" },
  { threshold: 0, tier: "ready", label: "Ready" },
];

const NEXT_THRESHOLDS = [20, 50, 80, 100];

export function taskChargePoints(task: GameTask): number {
  if (task.meta_work) return 0;
  const impact = task.impact === "high" ? 36 : task.impact === "medium" ? 26 : 18;
  const courage = task.courage_task ? 8 : 0;
  const weeklyWin = task.weekly_win ? 8 : 0;
  return Math.min(50, impact + courage + weeklyWin);
}

export function buildChargeState(input: {
  completedToday: GameTask[];
  bigFour: Record<string, WeeklyValue>;
}): ChargeState {
  const meaningful = input.completedToday.filter((task) => !task.meta_work);
  const actionPoints = Math.min(80, meaningful.reduce((total, task) => total + taskChargePoints(task), 0));
  const protectedAreas = Object.values(input.bigFour).filter((value) => value.target > 0 && value.done >= value.target).length;
  const balancePoints = meaningful.length > 0 ? Math.min(20, protectedAreas * 5) : 0;
  const charge = Math.min(100, actionPoints + balancePoints);
  const resolved = TIERS.find((candidate) => charge >= candidate.threshold) ?? TIERS[TIERS.length - 1];
  const nextTarget = NEXT_THRESHOLDS.find((threshold) => charge < threshold) ?? null;

  return {
    charge,
    tier: resolved.tier,
    label: resolved.label,
    meaningfulActions: meaningful.length,
    protectedAreas,
    nextTarget,
    pointsToNext: nextTarget === null ? 0 : nextTarget - charge,
  };
}

export function chooseBonusMission(bigFour: Record<string, WeeklyValue>): BonusMission | null {
  const candidates = DOMAIN_ORDER
    .map((slug) => {
      const value = bigFour[slug];
      if (!value || value.target <= 0 || value.done >= value.target) return null;
      return {
        slug,
        label: DOMAIN_LABELS[slug] ?? slug,
        done: value.done,
        target: value.target,
        ratio: value.done / value.target,
      };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null)
    .sort((a, b) => a.ratio - b.ratio || DOMAIN_ORDER.indexOf(a.slug as (typeof DOMAIN_ORDER)[number]) - DOMAIN_ORDER.indexOf(b.slug as (typeof DOMAIN_ORDER)[number]));

  const selected = candidates[0];
  if (!selected) return null;
  return { slug: selected.slug, label: selected.label, done: selected.done, target: selected.target };
}

export function buildAchievements(input: {
  meaningfulActions: number;
  courageActions: number;
  weeklyWins: number;
  representedDomains: string[];
  comebacks: number;
  milestones: number;
}): MissionAchievement[] {
  const represented = new Set(input.representedDomains.filter((slug) => DOMAIN_ORDER.includes(slug as (typeof DOMAIN_ORDER)[number]))).size;
  const values: MissionAchievement[] = [
    {
      id: "first_spark",
      title: "First Spark",
      description: "Complete the first meaningful action of the mission.",
      progress: Math.min(1, input.meaningfulActions),
      target: 1,
      earned: input.meaningfulActions >= 1,
    },
    {
      id: "four_corners",
      title: "Four Corners",
      description: "Create meaningful evidence in all four life areas.",
      progress: Math.min(4, represented),
      target: 4,
      earned: represented >= 4,
    },
    {
      id: "courage",
      title: "Courage Stack",
      description: "Finish three actions you marked as uncomfortable or brave.",
      progress: Math.min(3, input.courageActions),
      target: 3,
      earned: input.courageActions >= 3,
    },
    {
      id: "comeback",
      title: "Returner",
      description: "Come back and act after avoidance or a quiet stretch.",
      progress: Math.min(1, input.comebacks),
      target: 1,
      earned: input.comebacks >= 1,
    },
    {
      id: "weekly_win",
      title: "Weekly Win",
      description: "Finish a task designated as the week's decisive win.",
      progress: Math.min(1, input.weeklyWins),
      target: 1,
      earned: input.weeklyWins >= 1,
    },
    {
      id: "milestone",
      title: "Proof Point",
      description: "Reach and record a real mission milestone.",
      progress: Math.min(1, input.milestones),
      target: 1,
      earned: input.milestones >= 1,
    },
    {
      id: "long_game",
      title: "Long Game",
      description: "Accumulate fifty meaningful completed actions.",
      progress: Math.min(50, input.meaningfulActions),
      target: 50,
      earned: input.meaningfulActions >= 50,
    },
  ];
  return values;
}

function dateOnlyUtc(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function detectComeback(input: {
  today: string;
  meaningfulActionsToday: number;
  recentMeaningfulCompletionDates: string[];
}): ComebackState {
  if (input.meaningfulActionsToday <= 0) return { active: false, quietDays: 0 };
  const todayMs = dateOnlyUtc(input.today);
  if (todayMs === null) return { active: false, quietDays: 0 };

  const prior = input.recentMeaningfulCompletionDates
    .filter((date) => date < input.today)
    .map((date) => ({ date, ms: dateOnlyUtc(date) }))
    .filter((item): item is { date: string; ms: number } => item.ms !== null)
    .sort((a, b) => b.ms - a.ms)[0];

  if (!prior) return { active: false, quietDays: 0 };
  const elapsedDays = Math.round((todayMs - prior.ms) / 86_400_000);
  const quietDays = Math.max(0, elapsedDays - 1);
  return { active: quietDays > 0, quietDays };
}
