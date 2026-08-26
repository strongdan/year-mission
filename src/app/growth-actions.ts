"use server";

import { requireUser } from "@/lib/auth";
import {
  getActivePlan,
  listDomains,
  listEvidence,
  listMilestones,
  listTasks,
  listWorkouts,
} from "@/repositories/supabase-repository";
import type { DomainSlug } from "@/domain/constants";

export interface DomainGrowth {
  slug: DomainSlug;
  label: string;
  score: number;
  stage: "seed" | "sprout" | "growing" | "rooted" | "flourishing";
  points: number;
  meaningfulActions: number;
  comebacks: number;
}

// `home` remains the persisted legacy slug for compatibility. In the product it
// now represents Self: confidence, personal growth, identity, and self-trust.
const LABELS: Record<DomainSlug, string> = {
  money: "Money",
  body: "Body",
  home: "Self",
  capability: "Career",
};

function stageFor(score: number): DomainGrowth["stage"] {
  if (score >= 85) return "flourishing";
  if (score >= 60) return "rooted";
  if (score >= 35) return "growing";
  if (score >= 15) return "sprout";
  return "seed";
}

function scoreFor(points: number): number {
  // Cumulative and asymptotic: growth slows near 100, but completed work never causes regression.
  return Math.min(100, Math.round(100 * (1 - Math.exp(-Math.max(0, points) / 70))));
}

export async function getMissionGrowthAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." } as const;

  const plan = await getActivePlan(user.id);
  const start = plan?.start_date ?? "1970-01-01";
  const [domains, completed, workouts, evidence, milestones] = await Promise.all([
    listDomains(user.id),
    listTasks(user.id, { status: "completed", limit: 500 }),
    listWorkouts(user.id, start, 500),
    listEvidence(user.id, 500),
    listMilestones(user.id),
  ]);

  const slugByDomain = new Map(domains.map((domain) => [domain.id, domain.slug] as const));
  const buckets: Record<DomainSlug, { points: number; meaningfulActions: number; comebacks: number }> = {
    money: { points: 0, meaningfulActions: 0, comebacks: 0 },
    body: { points: 0, meaningfulActions: 0, comebacks: 0 },
    home: { points: 0, meaningfulActions: 0, comebacks: 0 },
    capability: { points: 0, meaningfulActions: 0, comebacks: 0 },
  };

  for (const task of completed) {
    if (!task.completed_at || task.completed_at.slice(0, 10) < start || task.meta_work) continue;
    const slug = task.domain?.slug ?? (task.domain_id ? slugByDomain.get(task.domain_id) : undefined);
    if (!slug) continue;
    const impact = task.impact === "high" ? 5 : task.impact === "medium" ? 3 : 1;
    const weeklyWin = task.weekly_win ? 4 : 0;
    const courage = task.courage_task ? 2 : 0;
    buckets[slug].points += impact + weeklyWin + courage;
    buckets[slug].meaningfulActions += 1;
  }

  for (const workout of workouts) {
    const date = workout.date;
    if (date < start) continue;
    const type = workout.type.toLowerCase();
    const points = type === "strength" ? 4 : type.includes("cardio") || type === "run" || type === "cycling" || type === "swim" ? 3 : type === "walking" ? 1 : 2;
    buckets.body.points += points;
    buckets.body.meaningfulActions += 1;
  }

  for (const item of evidence) {
    if (item.occurred_at < start) continue;
    const slug = item.domain_id ? slugByDomain.get(item.domain_id) : undefined;
    if (!slug) continue;
    const significance = Math.max(1, Math.min(5, item.significance ?? 1));
    buckets[slug].points += significance * 2;
    if (item.type === "avoidance_overcome") {
      buckets[slug].points += 3;
      buckets[slug].comebacks += 1;
    }
  }

  for (const milestone of milestones) {
    if (milestone.achieved_at < start) continue;
    const slug = milestone.domain_id ? slugByDomain.get(milestone.domain_id) : undefined;
    if (!slug) continue;
    buckets[slug].points += 10;
  }

  const growth = (Object.keys(buckets) as DomainSlug[]).map((slug) => {
    const bucket = buckets[slug];
    const score = scoreFor(bucket.points);
    return {
      slug,
      label: LABELS[slug],
      score,
      stage: stageFor(score),
      points: bucket.points,
      meaningfulActions: bucket.meaningfulActions,
      comebacks: bucket.comebacks,
    } satisfies DomainGrowth;
  });

  return { ok: true, data: growth } as const;
}
