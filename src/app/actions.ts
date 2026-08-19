"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { taskService } from "@/services/task-service";
import { TaskAiParser } from "@/services/coach/task-parser";
import { validateAiAction } from "@/domain/ai-actions";
import { applyAiAction } from "@/services/ai-action-service";
import { z } from "zod";
import {
  getDailyCheckin,
  insertWorkout,
  upsertDailyCheckin,
  upsertFinancialSnapshot,
  upsertHouseProgress,
  upsertWeeklyMode,
  listPendingProposals,
  updateProposal,
  insertProposal,
  getConversation,
  listMessages,
  insertConversation,
  insertMessage,
  listPromises,
  insertPromise,
  updatePromise,
  listExperiments,
  updateExperiment,
  insertIdea,
  updateIdea,
  insertTaskEvent,
} from "@/repositories/supabase-repository";
import { coachService } from "@/services/coach/coach-service";
import { metricsService } from "@/services/metrics-service";
import { buildCoachContext } from "@/services/coach/context";
import { listDomains, getActivePlan, listSeasons, getMonthlyFocus, listBlockedTaskIds } from "@/repositories/supabase-repository";
import { sequenceTasks } from "@/domain/sequencing";
import { getWeekMode } from "@/services/ai-action-service";
import { listTasks, listWorkouts, listFinancialSnapshots, listMilestones, listEvidence, getDailyCheckin as getTodayCheckin, listMomentumHistory, listIdeas, getWeeklyReview, upsertWeeklyReview, listHouseProgress, listDailyCheckins } from "@/repositories/supabase-repository";
import type { AiAction } from "@/domain/ai-actions";
import { detectOvercommitment } from "@/domain/reliability";
import { reliabilityInterpretation } from "@/domain/reliability";
import { momentumLabel } from "@/domain/momentum";
import { DEFERRAL_REASON_Z, FRICTION_REASON_Z, WEEK_MODE_Z } from "@/domain/constants";

function pathToRevalidate() {
  return ["/", "/tasks", "/progress", "/coach"];
}

function revalidateAll() {
  for (const p of pathToRevalidate()) revalidatePath(p);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function mondayOf(date = new Date()): string {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export async function createTaskAction(input: {
  title: string;
  domainId?: string | null;
  notes?: string;
  estimatedMinutes?: number;
  scheduledDate?: string | null;
  courageTask?: boolean;
  impact?: "low" | "medium" | "high";
  parseWithAi?: boolean;
}) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };

  let parsed = input;
  if (input.parseWithAi && input.title) {
    const parser = new TaskAiParser();
    const parsedAi = await parser.parseTask(input.title, todayISO());
    parsed = {
      ...input,
      title: parsedAi.title || input.title,
      domainId: input.domainId ?? null,
      notes: parsedAi.notes ?? input.notes,
      scheduledDate: parsedAi.scheduled_date ?? input.scheduledDate,
      estimatedMinutes: parsedAi.estimated_minutes ?? input.estimatedMinutes,
      courageTask: parsedAi.courage_task,
    };
  }

  const result = await taskService.create(user.id, {
    title: parsed.title,
    domainId: parsed.domainId,
    notes: parsed.notes,
    estimatedMinutes: parsed.estimatedMinutes,
    scheduledDate: parsed.scheduledDate,
    courageTask: parsed.courageTask,
    impact: parsed.impact,
    source: input.parseWithAi ? "ai_parse" : "manual",
  });
  revalidateAll();
  return result;
}

export async function promoteToWeekAction(taskId: string) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const result = await taskService.addToWeek(user.id, taskId);
  revalidateAll();
  return result;
}

export async function promoteToTodayAction(taskId: string) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const result = await taskService.addToToday(user.id, taskId);
  revalidateAll();
  return result;
}

export async function completeTaskAction(taskId: string) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const result = await taskService.complete(user.id, taskId);
  revalidateAll();
  return result;
}

export async function startTaskAction(taskId: string) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const result = await taskService.start(user.id, taskId);
  revalidateAll();
  return result;
}

const WSID_INPUT_Z = z.object({
  availableMinutes: z.number().int().min(5).max(480).nullable().optional(),
  energy: z.enum(["low", "medium", "high"]).nullable().optional(),
  excludeTaskId: z.string().nullable().optional(),
});

export async function whatShouldIDoAction(rawInput?: unknown) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = WSID_INPUT_Z.safeParse(rawInput ?? {});
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const input = parsed.data;

  const now = new Date();
  const weekStart = mondayOf();
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [candidates, blockedIds, monthlyFocus, bigFour, weekMode] = await Promise.all([
    listTasks(user.id, { status: ["today", "this_week", "in_progress"] }),
    listBlockedTaskIds(user.id, since),
    getMonthlyFocus(user.id, now.getFullYear(), now.getMonth() + 1),
    metricsService.bigFourProgressThisWeek(user.id, weekStart),
    getWeekMode(user.id),
  ]);

  const openSlugs = Object.entries(bigFour)
    .filter(([, v]) => v.done < v.target)
    .map(([slug]) => slug);

  const result = sequenceTasks({
    candidates,
    now,
    monthlyFocusDomainIds: monthlyFocus?.domain_id ? [monthlyFocus.domain_id] : [],
    monthlyFocusTitle: monthlyFocus?.title ?? null,
    bigFourOpenSlugs: openSlugs,
    bigFourProgress: bigFour,
    blockedTaskIds: blockedIds,
    availableMinutes: input.availableMinutes ?? null,
    energy: input.energy ?? null,
    weekMode,
    excludeTaskId: input.excludeTaskId ?? null,
  });

  return { ok: true, data: { result, weekMode } };
}

export async function deferTaskAction(taskId: string, reason: z.infer<typeof DEFERRAL_REASON_Z>, note?: string) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const result = await taskService.defer(user.id, taskId, reason, note);
  revalidateAll();
  return result;
}

export async function dropTaskAction(taskId: string) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const result = await taskService.drop(user.id, taskId);
  revalidateAll();
  return result;
}

export async function updateTaskAction(taskId: string, patch: { title?: string; notes?: string; estimatedMinutes?: number; scheduledDate?: string | null }) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const result = await taskService.update(taskId, patch);
  revalidateAll();
  return result;
}

export async function setWeeklyWinAction(taskId: string) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const { ok, message } = await (await import("@/services/ai-action-service")).applyAiAction({
    action: "set_weekly_win",
    task_id: taskId,
  } as AiAction);
  if (ok) {
    await insertTaskEvent({ user_id: user.id, task_id: taskId, event_type: "status_changed", event_data: { weekly_win: true } });
  }
  revalidateAll();
  return { ok, message };
}

export async function createProjectAction(input: { title: string; description?: string; domainId?: string | null }) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const result = await taskService.createProject(user.id, input);
  revalidateAll();
  return result;
}

export async function checkinAction(input: {
  alcoholFree?: boolean;
  weight?: number | null;
  steps?: number | null;
  water?: number | null;
  mood?: number | null;
  energy?: number | null;
  sleepHours?: number | null;
  notes?: string;
}) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const existing = await getDailyCheckin(user.id, todayISO());
  await upsertDailyCheckin({
    user_id: user.id,
    date: todayISO(),
    alcohol_free: input.alcoholFree ?? existing?.alcohol_free ?? false,
    weight: input.weight ?? existing?.weight ?? null,
    steps: input.steps ?? existing?.steps ?? null,
    water: input.water ?? existing?.water ?? null,
    mood: input.mood ?? existing?.mood ?? null,
    energy: input.energy ?? existing?.energy ?? null,
    sleep_hours: input.sleepHours ?? existing?.sleep_hours ?? null,
    notes: input.notes ?? existing?.notes ?? null,
  });
  revalidateAll();
  return { ok: true };
}

export async function logWorkoutAction(input: { type: string; durationMinutes?: number; notes?: string; date?: string }) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  await insertWorkout({
    user_id: user.id,
    date: input.date ?? todayISO(),
    type: input.type,
    duration_minutes: input.durationMinutes ?? null,
    notes: input.notes ?? null,
  });
  revalidateAll();
  return { ok: true };
}

export async function logDebtAction(input: { consumerDebt: number; cashReserve?: number | null; notes?: string }) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  await upsertFinancialSnapshot({
    user_id: user.id,
    date: todayISO(),
    consumer_debt: input.consumerDebt,
    cash_reserve: input.cashReserve ?? null,
    notes: input.notes ?? null,
  });
  revalidateAll();
  return { ok: true };
}

export async function logHouseProgressAction(input: { readinessScore: number; notes?: string }) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  await upsertHouseProgress({
    user_id: user.id,
    date: todayISO(),
    readiness_score: input.readinessScore,
    notes: input.notes ?? null,
  });
  revalidateAll();
  return { ok: true };
}

export async function setWeekModeAction(mode: z.infer<typeof WEEK_MODE_Z>) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  await upsertWeeklyMode({ user_id: user.id, week_start: mondayOf(), mode });
  revalidateAll();
  return { ok: true };
}

export async function saveWeeklyReviewAction(input: {
  wins: string[];
  difficulties: string[];
  why: string;
  stopDoing: string[];
  overcommitted: boolean | null;
  nextWeeklyWin: string;
  mostImportantActions: Record<string, string>;
}) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const weekStart = mondayOf();
  const existing = await getWeeklyReview(user.id, weekStart);
  await upsertWeeklyReview({
    user_id: user.id,
    week_start: weekStart,
    wins: input.wins,
    difficulties: input.difficulties,
    why_not: input.why || null,
    stop_doing: input.stopDoing,
    overcommitted: input.overcommitted,
    next_weekly_win: input.nextWeeklyWin || null,
    most_important_actions: input.mostImportantActions,
    ...(existing?.mode ? { mode: existing.mode } : {}),
  });
  revalidateAll();
  return { ok: true };
}

export async function logFrictionAction(input: { taskId?: string | null; reason: z.infer<typeof FRICTION_REASON_Z>; note?: string }) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const { createServerClientForApp } = await import("@/integrations/supabase/server");
  const supabase = await createServerClientForApp();
  if (supabase) {
    await supabase.from("friction_events").insert({
      user_id: user.id,
      task_id: input.taskId ?? null,
      reason: input.reason,
      note: input.note ?? null,
    });
  }
  revalidateAll();
  return { ok: true };
}

export async function coachAction(message: string, conversationId?: string | null) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const [domains, plan] = await Promise.all([
    listDomains(user.id),
    getActivePlan(user.id),
  ]);

  const todayTasks = await listTasks(user.id, { status: "today" });
  const weeklyCommitments = await listTasks(user.id, { status: "this_week" });
  const completedTasks = await listTasks(user.id, { status: "completed", limit: 50 });
  const workouts = await listWorkouts(user.id, mondayOf());
  const financial = await listFinancialSnapshots(user.id, 1);
  const todayCheckin = await getTodayCheckin(user.id, todayISO());
  const promises = await listPromises(user.id);
  const experiments = await listExperiments(user.id);
  const evidence = await listEvidence(user.id, 20);
  const milestones = await listMilestones(user.id);
  const deferred = weeklyCommitments.filter((t) => t.defer_count > 0);
  const weeklyWins = completedTasks.filter((t) => t.weekly_win);

  let resolvedConversationId = conversationId ?? null;
  if (!resolvedConversationId) {
    const conv = await insertConversation({ user_id: user.id, title: "Coach" });
    resolvedConversationId = conv.id;
  }
  const historyRaw = resolvedConversationId ? await listMessages(resolvedConversationId, 20) : [];
  const history = historyRaw
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-8)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  await insertMessage({ conversation_id: resolvedConversationId, role: "user", content: message });

  const context = buildCoachContext({
    plan: plan ? { title: plan.title, start: plan.start_date, end: plan.end_date } : null,
    season: null,
    monthlyFocus: null,
    weekMode: null,
    domains,
    weeklyCommitments,
    todayTasks,
    backlogCount: (await listTasks(user.id, { status: "backlog" })).length,
    momentum: null,
    todayCheckin,
    workoutsThisWeek: workouts.length,
    consumerDebt: financial[0]?.consumer_debt ?? null,
    houseReadiness: null,
    deferredTasks: deferred,
    weeklyWins,
    weeklyReviews: [],
    milestones,
    evidence,
    experiments,
    promises,
    friction: [],
    recentConversation: history,
  });

  const reply = await coachService.chat({ message, context, history });

  await insertMessage({
    conversation_id: resolvedConversationId,
    role: "assistant",
    content: reply.content,
    model: reply.model,
    input_tokens: reply.inputTokens,
    output_tokens: reply.outputTokens,
    estimated_cost: reply.estimatedCost,
    latency_ms: reply.latencyMs,
  });

  return { ok: true, data: { reply: reply.content, conversationId: resolvedConversationId } };
}

export async function getCoachConversationAction(conversationId: string) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const conversation = await getConversation(conversationId);
  if (!conversation || conversation.user_id !== user.id) return { ok: false, error: "Not found." };
  const messages = await listMessages(conversationId, 100);
  return { ok: true, data: { conversation, messages } };
}

export async function createProposalAction(action: AiAction) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const validated = validateAiAction(action);
  if (!validated.ok) return { ok: false, error: validated.error };
  const proposal = await insertProposal({
    user_id: user.id,
    action_type: validated.action.action,
    payload: validated.action as unknown as import("@/integrations/supabase/types").Json,
    reasoning: "reason" in validated.action ? validated.action.reason : null,
    status: "pending",
  });
  return { ok: true, data: { proposalId: proposal.id } };
}

export async function resolveProposalAction(proposalId: string, decision: "approve" | "reject") {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const pending = await listPendingProposals(user.id);
  const proposal = pending.find((p) => p.id === proposalId);
  if (!proposal) return { ok: false, error: "Proposal not found or already resolved." };

  if (decision === "approve") {
    const validated = validateAiAction(proposal.payload);
    if (!validated.ok) {
      await updateProposal(proposal.id, { status: "rejected", resolved_at: new Date().toISOString() });
      return { ok: false, error: "Invalid proposal payload." };
    }
    const result = await applyAiAction(validated.action);
    if (!result.ok) return { ok: false, error: result.message };
    await updateProposal(proposal.id, { status: "approved", resolved_at: new Date().toISOString() });
  } else {
    await updateProposal(proposal.id, { status: "rejected", resolved_at: new Date().toISOString() });
  }
  revalidateAll();
  return { ok: true };
}

export async function listProposalsAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const proposals = await listPendingProposals(user.id);
  return { ok: true, data: proposals };
}

export async function createPromiseAction(input: { title: string; committedFor: string; taskId?: string | null }) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  await insertPromise({ user_id: user.id, title: input.title, committed_for: input.committedFor, task_id: input.taskId ?? null });
  revalidateAll();
  return { ok: true };
}

export async function resolvePromiseAction(promiseId: string, status: "kept" | "renegotiated" | "missed", reason?: string) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  await updatePromise(promiseId, {
    status,
    resolution_reason: reason ?? null,
    resolved_at: new Date().toISOString(),
  });
  revalidateAll();
  return { ok: true };
}

export async function createExperimentAction(input: { title: string; hypothesis?: string; startDate: string; plannedEndDate?: string | null; targetMetric?: string; baselineValue?: number | null }) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const experiments = await listExperiments(user.id);
  const activeCount = experiments.filter((e) => e.status === "active").length;
  if (activeCount >= 2) return { ok: false, error: "Two experiments are already active. Replace or defer one first." };
  await (await import("@/repositories/supabase-repository")).insertExperiment({
    user_id: user.id,
    title: input.title,
    hypothesis: input.hypothesis ?? null,
    start_date: input.startDate,
    planned_end_date: input.plannedEndDate ?? null,
    target_metric: input.targetMetric ?? null,
    baseline_value: input.baselineValue ?? null,
    status: "active",
  });
  revalidateAll();
  return { ok: true };
}

export async function concludeExperimentAction(experimentId: string, decision: "keep" | "modify" | "abandon", conclusion?: string) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const experiments = await listExperiments(user.id);
  const experiment = experiments.find((e) => e.id === experimentId);
  if (!experiment) return { ok: false, error: "Experiment not found." };
  await updateExperiment(experimentId, {
    status: decision === "abandon" ? "abandoned" : "completed",
    decision,
    conclusion: conclusion ?? null,
    completed_at: new Date().toISOString(),
  });
  revalidateAll();
  return { ok: true };
}

export async function createIdeaAction(input: { title: string; notes?: string }) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  await insertIdea({ user_id: user.id, title: input.title, notes: input.notes ?? null, status: "parked" });
  revalidateAll();
  return { ok: true };
}

export async function resolveIdeaAction(ideaId: string, status: "parked" | "active" | "deleted") {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  await updateIdea(ideaId, { status, last_reviewed_at: new Date().toISOString() });
  revalidateAll();
  return { ok: true };
}

export async function recordEvidenceAction(input: { type: string; title: string; description?: string; domainId?: string | null; occurredAt?: string }) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  await (await import("@/repositories/supabase-repository")).insertEvidence({
    user_id: user.id,
    type: input.type,
    title: input.title,
    description: input.description ?? null,
    domain_id: input.domainId ?? null,
    occurred_at: input.occurredAt ?? todayISO(),
    significance: 2,
  });
  revalidateAll();
  return { ok: true };
}

export async function getTasksAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const [inbox, week, today, backlog, completed, projects] = await Promise.all([
    listTasks(user.id, { status: "inbox" }),
    listTasks(user.id, { status: "this_week" }),
    listTasks(user.id, { status: "today" }),
    listTasks(user.id, { status: "backlog" }),
    listTasks(user.id, { status: "completed", limit: 15 }),
    (await import("@/repositories/supabase-repository")).listProjects(user.id),
  ]);
  return { ok: true, data: { inbox, week, today, backlog, completed, projects } };
}

export async function getDashboardAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const weekStart = mondayOf();
  const [domains, todayTasks, weeklyCommitments, completedTasks, workouts, financial, todayCheckin, promises, experiments, evidence, milestones, momentumHistory, ideas, weeklyReview, houseProgress, weekCheckins] = await Promise.all([
    listDomains(user.id),
    listTasks(user.id, { status: "today" }),
    listTasks(user.id, { status: "this_week" }),
    listTasks(user.id, { status: "completed", limit: 100 }),
    listWorkouts(user.id, weekStart),
    listFinancialSnapshots(user.id, 1),
    getTodayCheckin(user.id, todayISO()),
    listPromises(user.id),
    listExperiments(user.id),
    listEvidence(user.id, 30),
    listMilestones(user.id),
    listMomentumHistory(user.id, 30),
    listIdeas(user.id),
    getWeeklyReview(user.id, weekStart),
    listHouseProgress(user.id, 1),
    listDailyCheckins(user.id, weekStart),
  ]);

  const bigFour = await metricsService.bigFourProgressThisWeek(user.id, weekStart);
  const momentum = await metricsService.computeAndStoreMomentum(user.id, weekStart);
  const reliabilityRaw = await metricsService.reliability(user.id);
  const agency = await metricsService.agency(user.id);
  const weekMode = await getWeekMode(user.id);

  const [season, monthlyFocus] = await currentSeasonAndFocus(user.id);

  const outcomes = promises
    .filter((p) => p.status === "kept" || p.status === "renegotiated" || p.status === "missed")
    .map((p) => ({ type: "promise" as const, status: p.status as "kept" | "renegotiated" | "missed" }));
  const overcommit = detectOvercommitment(outcomes);

  return {
    ok: true,
    data: {
      domains,
      todayTasks,
      weeklyCommitments,
      completedToday: completedTasks.filter((t) => t.completed_at?.slice(0, 10) === todayISO()),
      workouts,
      financial,
      todayCheckin,
      promises,
      experiments,
      evidence,
      milestones,
      momentumHistory,
      ideas,
      weeklyReview,
      weeklyWins: completedTasks.filter((t) => t.weekly_win),
      weeklyWin: weeklyCommitments.find((t) => t.weekly_win) ?? null,
      season,
      monthlyFocus,
      walkToday: workouts.some((w) => w.date === todayISO() && w.type === "walking"),
      houseReadiness: houseProgress[0]?.readiness_score ?? null,
      houseReadinessDate: houseProgress[0]?.date ?? null,
      alcoholFreeDays: weekCheckins.filter((c) => c.alcohol_free).length,
      stepsToday: todayCheckin?.steps ?? null,
      bigFour,
      momentum,
      momentumLabel: momentumLabel(momentum),
      reliability: reliabilityRaw,
      reliabilityInterpretation: reliabilityRaw === null ? "" : reliabilityInterpretation(reliabilityRaw),
      agency,
      overcommit,
      weekStart,
      weekMode,
    },
  };
}

async function currentSeasonAndFocus(userId: string): Promise<[{ name: string; objective: string | null } | null, { title: string; description: string | null } | null]> {
  const plan = await getActivePlan(userId);
  let season: { name: string; objective: string | null } | null = null;
  if (plan) {
    const seasons = await listSeasons(plan.id);
    const today = todayISO();
    const active = seasons.find((s) => s.start_date <= today && today <= s.end_date);
    if (active) season = { name: active.name, objective: active.objective };
  }
  const now = new Date();
  const focus = await getMonthlyFocus(userId, now.getFullYear(), now.getMonth() + 1);
  const monthlyFocus = focus ? { title: focus.title, description: focus.description } : null;
  return [season, monthlyFocus];
}

export async function getGoogleSyncStatusAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const { isGoogleTasksConfigured } = await import("@/services/google/config");
  const { getGoogleConnection, listGoogleSyncRecords } = await import("@/repositories/supabase-repository");
  const [connection, records] = await Promise.all([getGoogleConnection(user.id), listGoogleSyncRecords(user.id)]);
  const lastSyncedAt = records.reduce((latest, r) => (r.last_synced_at && r.last_synced_at > latest ? r.last_synced_at : latest), "");
  return {
    ok: true,
    data: {
      configured: isGoogleTasksConfigured(),
      connected: !!(connection?.refresh_token && connection.token_encrypted),
      email: connection?.email ?? null,
      lastSyncedAt: lastSyncedAt || null,
    },
  };
}

export async function connectGoogleTasksAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const { connectGoogleTasksUrl } = await import("@/services/google/sync-service");
  const result = await connectGoogleTasksUrl(user.id);
  if ("error" in result) return { ok: false, error: result.error };
  return { ok: true, data: { url: result.url } };
}

export async function syncGoogleTasksAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const { syncGoogleTasks } = await import("@/services/google/sync-service");
  const result = await syncGoogleTasks(user.id);
  if (result.outcome === "not_configured") return { ok: false, error: "Google Tasks is not configured on the server." };
  if (result.outcome === "not_connected") return { ok: false, error: "Connect Google Tasks first." };
  if (result.outcome === "error") return { ok: false, error: result.error ?? "Google sync failed." };
  revalidateAll();
  return { ok: true, data: { summary: result.summary } };
}

export async function disconnectGoogleTasksAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const { disconnectGoogleTasks } = await import("@/services/google/sync-service");
  await disconnectGoogleTasks(user.id);
  revalidateAll();
  return { ok: true };
}