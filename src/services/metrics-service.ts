import {
  listTasks,
  listWorkouts,
  listMilestones,
  listEvidence,
  listPromises,
} from "@/repositories/supabase-repository";
import {
  computeCategoryMomentum,
  computeMomentum,
  type CategoryMomentum,
  type DayActivity,
} from "@/domain/momentum";
import { WEEKLY_MINIMUM_COUNTS, type DomainSlug } from "@/domain/constants";
import { sizeFromMinutes, taskWeight } from "@/domain/task-weight";
import { computeReliability, type CommitmentOutcome } from "@/domain/reliability";
import { agencyLevel } from "@/domain/agency";

export interface DashboardMetrics {
  momentum: number | null;
  momentumLabel: string;
  categoryMomentum: CategoryMomentum[];
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

const DOMAIN_SLUG_SET = new Set<DomainSlug>(["money", "body", "home", "capability"]);

function emptyDomainUnits(): Record<DomainSlug, number> {
  return { body: 0, money: 0, home: 0, capability: 0 };
}

function isoDateOffset(date: Date, days: number): string {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function meaningfulTaskUnits(weight: number): number {
  if (weight <= 0) return 0;
  // Keep quick/low-impact work from gaming the signal while allowing a
  // consequential task to count as more than one ordinary rep.
  return Math.min(2, Math.max(0.5, weight / 3));
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

  async categoryMomentum(userId: string, asOf = new Date()): Promise<CategoryMomentum[]> {
    const end = isoDateOffset(asOf, 0);
    const recentStart = isoDateOffset(asOf, -6);
    const previousStart = isoDateOffset(asOf, -13);
    const previousEnd = isoDateOffset(asOf, -7);
    const [workouts, completed] = await Promise.all([
      listWorkouts(userId, previousStart, 200),
      listTasks(userId, { status: "completed", limit: 500 }),
    ]);

    const recentUnits = emptyDomainUnits();
    const previousUnits = emptyDomainUnits();
    const add = (slug: DomainSlug, date: string, units: number) => {
      if (date < previousStart || date > end || units <= 0) return;
      if (date >= recentStart) recentUnits[slug] += units;
      else if (date <= previousEnd) previousUnits[slug] += units;
    };

    // Body uses actual logged movement rather than task completion so checking
    // off a workout task and logging the same workout cannot double-count it.
    for (const workout of workouts) add("body", workout.date, 1);

    for (const task of completed) {
      if (!task.completed_at || !task.domain?.slug || task.domain.slug === "body") continue;
      const slug = task.domain.slug;
      if (!DOMAIN_SLUG_SET.has(slug)) continue;
      const weight = taskWeight({
        impact: task.impact,
        size: sizeFromMinutes(task.estimated_minutes),
        courage: task.courage_task,
        metaWork: task.meta_work,
      });
      add(slug, task.completed_at.slice(0, 10), meaningfulTaskUnits(weight));
    }

    return computeCategoryMomentum({ recentUnits, previousUnits, weeklyTargets: WEEKLY_MINIMUM_COUNTS });
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