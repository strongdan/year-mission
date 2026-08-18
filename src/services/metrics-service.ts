import {
  listTasks,
  listWorkouts,
  listMilestones,
  listEvidence,
  listPromises,
} from "@/repositories/supabase-repository";
import { computeMomentum, type DayActivity } from "@/domain/momentum";
import { WEEKLY_MINIMUM_COUNTS } from "@/domain/constants";
import { taskWeight } from "@/domain/task-weight";
import { computeReliability, type CommitmentOutcome } from "@/domain/reliability";
import { agencyLevel } from "@/domain/agency";

export interface DashboardMetrics {
  momentum: number | null;
  momentumLabel: string;
  reliability: number | null;
  reliabilityInterpretation: string;
  agency: string;
  workoutsThisWeek: number;
  bigFourThisWeek: Record<string, { done: number; target: number }>;
  alcoholFreeDays: number;
  latestWeight: number | null;
  latestDebt: number | null;
  houseReadiness: number | null;
  activeExperimentCount: number;
}

export class MetricsService {
  async bigFourProgressThisWeek(userId: string, weekStart: string): Promise<Record<string, { done: number; target: number }>> {
    const workouts = await listWorkouts(userId, weekStart);
    const workoutCount = workouts.length;
    const todayTasks = await listTasks(userId, { status: "today" });
    const completedTasks = await listTasks(userId, { status: "completed", limit: 200 });

    const completedThisWeek = completedTasks.filter((t) => t.completed_at && t.completed_at >= weekStart);
    const moneyDone = completedThisWeek.filter((t) => t.domain?.slug === "money").length + todayTasks.filter((t) => t.domain?.slug === "money").length;
    const homeDone = completedThisWeek.filter((t) => t.domain?.slug === "home").length + todayTasks.filter((t) => t.domain?.slug === "home").length;
    const capabilityDone = completedThisWeek.filter((t) => t.domain?.slug === "capability").length + todayTasks.filter((t) => t.domain?.slug === "capability").length;

    return {
      body: { done: Math.min(workoutCount, WEEKLY_MINIMUM_COUNTS.body), target: WEEKLY_MINIMUM_COUNTS.body },
      money: { done: Math.min(moneyDone, WEEKLY_MINIMUM_COUNTS.money), target: WEEKLY_MINIMUM_COUNTS.money },
      home: { done: Math.min(homeDone, WEEKLY_MINIMUM_COUNTS.home), target: WEEKLY_MINIMUM_COUNTS.home },
      capability: { done: Math.min(capabilityDone, WEEKLY_MINIMUM_COUNTS.capability), target: WEEKLY_MINIMUM_COUNTS.capability },
    };
  }

  async computeAndStoreMomentum(userId: string, weekStart: string): Promise<number | null> {
    const days = await this.buildDayActivities(userId, weekStart);
    const momentum = computeMomentum({ days });
    if (momentum === null) return null;
    const { createServerClientForApp } = await import("@/integrations/supabase/server");
    const supabase = await createServerClientForApp();
    if (supabase) {
      await supabase.from("momentum_history").upsert({
        user_id: userId,
        date: new Date().toISOString().slice(0, 10),
        overall_score: momentum,
      });
    }
    return momentum;
  }

  private async getCheckinsSince(userId: string, start: string) {
    const { createServerClientForApp } = await import("@/integrations/supabase/server");
    const supabase = await createServerClientForApp();
    if (!supabase) return [];
    const { data } = await supabase.from("daily_checkins").select("*").eq("user_id", userId).gte("date", start);
    return data ?? [];
  }

  private async buildDayActivities(userId: string, weekStart: string): Promise<DayActivity[]> {
    const workouts = await listWorkouts(userId, weekStart, 90);
    const checkins = await this.getCheckinsSince(userId, weekStart);
    const completed = await listTasks(userId, { status: "completed", limit: 500 });
    const milestones = await listMilestones(userId);

    const dayMap = new Map<string, DayActivity>();
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(weekStart + "T00:00:00");
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });

    for (const date of days) {
      dayMap.set(date, {
        date,
        bigFourCompleted: 0,
        meaningfulTasksCompleted: 0,
        minimumDayMet: false,
        weekMode: "normal",
      });
    }

    const alcoholFreeDates = new Set(checkins.filter((c) => c.alcohol_free).map((c) => c.date));
    const workoutDates = new Map<string, number>();
    for (const w of workouts) {
      workoutDates.set(w.date, (workoutDates.get(w.date) ?? 0) + 1);
    }

    const completedByDate = new Map<string, number>();
    for (const t of completed) {
      if (t.completed_at) {
        const date = t.completed_at.slice(0, 10);
        if (dayMap.has(date)) {
          const weight = taskWeight({ impact: t.impact, size: "standard", courage: t.courage_task, metaWork: t.meta_work });
          completedByDate.set(date, (completedByDate.get(date) ?? 0) + weight);
        }
      }
    }

    const milestoneDates = new Set(milestones.map((m) => m.achieved_at));
    for (const date of days) {
      const d = dayMap.get(date)!;
      const workoutsThatDay = workoutDates.get(date) ?? 0;
      d.bigFourCompleted = Math.min(4, workoutsThatDay);
      d.meaningfulTasksCompleted = completedByDate.get(date) ?? 0;
      d.minimumDayMet = alcoholFreeDates.has(date) || workoutsThatDay >= 1 || (completedByDate.get(date) ?? 0) >= 1;
      if (milestoneDates.has(date)) d.milestone = true;
    }

    return [...dayMap.values()].sort((a, b) => a.date.localeCompare(b.date));
  }

  async reliability(userId: string): Promise<number | null> {
    const promises = await listPromises(userId);
    const completed = await listTasks(userId, { status: "completed", limit: 200 });
    const outcomes: CommitmentOutcome[] = [];
    for (const p of promises) {
      if (p.status === "kept") outcomes.push({ type: "promise", status: "kept" });
      else if (p.status === "renegotiated") outcomes.push({ type: "promise", status: "renegotiated" });
      else if (p.status === "missed") outcomes.push({ type: "promise", status: "missed" });
    }
    const weeklyCompleted = completed.filter((t) => t.weekly_commitment);
    weeklyCompleted.forEach(() => outcomes.push({ type: "task", status: "kept" }));
    const result = computeReliability({ outcomes });
    return result.weightedTotal === 0 ? null : result.score;
  }

  async agency(userId: string): Promise<string> {
    const evidence = await listEvidence(userId, 100);
    const courage = evidence.filter((e) => e.type === "courage").length;
    const avoidanceOvercome = evidence.filter((e) => e.type === "avoidance_overcome").length;
    const level = agencyLevel({
      courageTasksCompleted: courage,
      deferredTasksCompleted: avoidanceOvercome,
      avoidedTasksStarted: avoidanceOvercome,
      blockersResolved: 0,
    });
    const { agencyLabel } = await import("@/domain/agency");
    return agencyLabel(level);
  }
}

export const metricsService = new MetricsService();