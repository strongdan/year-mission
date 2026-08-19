import type {
  Task,
  Domain,
  WeeklyReview,
  Milestone,
  Evidence,
  Experiment,
  Promise_,
  DailyCheckin,
  FrictionEvent,
} from "@/types/models";

export interface CoachContextPacket {
  plan: { title: string; start: string; end: string } | null;
  season: { name: string; objective: string | null } | null;
  monthlyFocus: { title: string; description: string | null } | null;
  weekMode: string | null;
  goals: Domain[];
  weeklyCommitments: Task[];
  todayTasks: Task[];
  backlogCount: number;
  recentMetrics: {
    momentum: number | null;
    today: { alcoholFree: boolean; weight: number | null; steps: number | null };
    workoutsThisWeek: number;
    consumerDebt: number | null;
    houseReadiness: number | null;
  };
  recentDeferrals: Task[];
  recentWins: Task[];
  weeklyReviews: WeeklyReview[];
  milestones: Milestone[];
  evidence: Evidence[];
  experiments: Experiment[];
  promises: Promise_[];
  friction: FrictionEvent[];
  conversations: { role: string; content: string }[];
}

export interface ContextBuilderInputs {
  plan: { title: string; start: string; end: string } | null;
  season: { name: string; objective: string | null } | null;
  monthlyFocus: { title: string; description: string | null } | null;
  weekMode: string | null;
  domains: Domain[];
  weeklyCommitments: Task[];
  todayTasks: Task[];
  backlogCount: number;
  momentum: number | null;
  todayCheckin: DailyCheckin | null;
  workoutsThisWeek: number;
  consumerDebt: number | null;
  houseReadiness: number | null;
  deferredTasks: Task[];
  weeklyWins: Task[];
  weeklyReviews: WeeklyReview[];
  milestones: Milestone[];
  evidence: Evidence[];
  experiments: Experiment[];
  promises: Promise_[];
  friction: FrictionEvent[];
  recentConversation: { role: string; content: string }[];
}

export function buildCoachContext(input: ContextBuilderInputs): CoachContextPacket {
  return {
    plan: input.plan,
    season: input.season,
    monthlyFocus: input.monthlyFocus,
    weekMode: input.weekMode,
    goals: input.domains,
    weeklyCommitments: input.weeklyCommitments,
    todayTasks: input.todayTasks,
    backlogCount: input.backlogCount,
    recentMetrics: {
      momentum: input.momentum,
      today: {
        alcoholFree: input.todayCheckin?.alcohol_free ?? false,
        weight: input.todayCheckin?.weight ?? null,
        steps: input.todayCheckin?.steps ?? null,
      },
      workoutsThisWeek: input.workoutsThisWeek,
      consumerDebt: input.consumerDebt,
      houseReadiness: input.houseReadiness,
    },
    recentDeferrals: input.deferredTasks,
    recentWins: input.weeklyWins,
    weeklyReviews: input.weeklyReviews,
    milestones: input.milestones,
    evidence: input.evidence,
    experiments: input.experiments,
    promises: input.promises,
    friction: input.friction,
    conversations: input.recentConversation,
  };
}

export function serializeContext(packet: CoachContextPacket): string {
  return JSON.stringify(packet, null, 0);
}