"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/integrations/supabase/server";
import { listDomains, listEvidence, listTasks, listWorkouts } from "@/repositories/supabase-repository";
import { summarizeMonthlyActivity, type ScorecardDomain } from "@/domain/monthly-scorecard";

const DECISION_Z = z.object({
  decision: z.string().trim().min(1).max(500),
  context: z.string().trim().max(5000).optional(),
  reasoning: z.string().trim().max(5000).optional(),
  confidence: z.number().int().min(0).max(100).nullable().optional(),
  reviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

const OUTCOME_Z = z.object({
  id: z.string().uuid(),
  actualOutcome: z.string().trim().min(1).max(5000),
});

function monthStart(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function tableMissing(error: { code?: string; message?: string } | null | undefined): boolean {
  return error?.code === "42P01" || Boolean(error?.message?.includes("decision_log"));
}

export async function getRoadmapReviewAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };

  const start = monthStart();
  const [backlog, completed, workouts, evidence, domains] = await Promise.all([
    listTasks(user.id, { status: "backlog" }),
    listTasks(user.id, { status: "completed", limit: 500 }),
    listWorkouts(user.id, start, 500),
    listEvidence(user.id, 500),
    listDomains(user.id),
  ]);

  const slugByDomain = new Map(domains.map((domain) => [domain.id, domain.slug] as const));
  const monthlyCompleted = completed.filter((task) => task.completed_at && task.completed_at.slice(0, 10) >= start);
  const evidenceByDomain: Partial<Record<ScorecardDomain, number>> = {};
  for (const item of evidence) {
    if (!item.occurred_at || item.occurred_at.slice(0, 10) < start || !item.domain_id) continue;
    const slug = slugByDomain.get(item.domain_id) as ScorecardDomain | undefined;
    if (!slug || !["money", "body", "home", "capability"].includes(slug)) continue;
    evidenceByDomain[slug] = (evidenceByDomain[slug] ?? 0) + 1;
  }

  const scorecard = summarizeMonthlyActivity({
    completedTasks: monthlyCompleted.map((task) => ({
      domainSlug: task.domain?.slug ?? (task.domain_id ? slugByDomain.get(task.domain_id) : null),
      metaWork: task.meta_work,
      weeklyWin: task.weekly_win,
      courageTask: task.courage_task,
    })),
    workouts: workouts.length,
    evidenceByDomain,
  });

  const staleCutoff = new Date(Date.now() - 90 * 86_400_000).toISOString();
  const staleBacklog = backlog
    .filter((task) => task.updated_at < staleCutoff)
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
    .slice(0, 20);

  const admin = await createAdminClient();
  let decisions: Array<Record<string, unknown>> = [];
  let decisionLogReady = false;
  if (admin) {
    const { data, error } = await admin
      .from("decision_log")
      .select("id,decision,context,reasoning,confidence,decided_at,review_date,actual_outcome,reviewed_at,created_at")
      .eq("user_id", user.id)
      .order("decided_at", { ascending: false })
      .limit(25);
    if (!error) {
      decisions = (data ?? []) as Array<Record<string, unknown>>;
      decisionLogReady = true;
    } else if (!tableMissing(error)) {
      return { ok: false as const, error: error.message };
    }
  }

  return {
    ok: true as const,
    data: {
      monthStart: start,
      scorecard,
      staleBacklog,
      decisions,
      decisionLogReady,
    },
  };
}

export async function createDecisionAction(input: unknown) {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  const parsed = DECISION_Z.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the decision fields." };
  const admin = await createAdminClient();
  if (!admin) return { ok: false as const, error: "Database admin access is not configured." };
  const value = parsed.data;
  const { error } = await admin.from("decision_log").insert({
    user_id: user.id,
    decision: value.decision,
    context: value.context || null,
    reasoning: value.reasoning || null,
    confidence: value.confidence ?? null,
    review_date: value.reviewDate ?? null,
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function recordDecisionOutcomeAction(input: unknown) {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  const parsed = OUTCOME_Z.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the outcome." };
  const admin = await createAdminClient();
  if (!admin) return { ok: false as const, error: "Database admin access is not configured." };
  const now = new Date().toISOString();
  const { error } = await admin
    .from("decision_log")
    .update({ actual_outcome: parsed.data.actualOutcome, reviewed_at: now, updated_at: now })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
