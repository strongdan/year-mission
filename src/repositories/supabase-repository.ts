import { createServerClientForApp } from "@/integrations/supabase/server";
import type {
  Task,
  TaskEvent,
  Project,
  Domain,
  Plan,
  Season,
  MonthlyFocus,
  DailyCheckin,
  Workout,
  FinancialSnapshot,
  HouseProgress,
  WeeklyMode,
  WeeklyReview,
  Milestone,
  MomentumHistory,
  Experiment,
  Promise_,
  Idea,
  Evidence,
  AiConversation,
  AiMessage,
  AiProposal,
  GoogleConnection,
  GoogleTaskSync,
  FrictionEvent,
} from "@/types/models";
import type { Json } from "@/integrations/supabase/types";

export class RepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryError";
  }
}

async function client() {
  const supabase = await createServerClientForApp();
  if (!supabase) throw new RepositoryError("Supabase is not configured.");
  return supabase;
}

export async function getProfile(userId: string) {
  const supabase = await client();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw new RepositoryError(error.message);
  return data as import("@/types/models").Profile | null;
}

export async function listDomains(userId: string): Promise<Domain[]> {
  const supabase = await client();
  const { data, error } = await supabase.from("domains").select("*").eq("user_id", userId).order("created_at");
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as Domain[];
}

export async function getActivePlan(userId: string): Promise<Plan | null> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new RepositoryError(error.message);
  return data as Plan | null;
}

export async function listSeasons(planId: string): Promise<Season[]> {
  const supabase = await client();
  const { data, error } = await supabase.from("seasons").select("*").eq("plan_id", planId).order("sequence");
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as Season[];
}

export async function getMonthlyFocus(userId: string, year: number, month: number): Promise<MonthlyFocus | null> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("monthly_focuses")
    .select("*")
    .eq("user_id", userId)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();
  if (error) throw new RepositoryError(error.message);
  return data as MonthlyFocus | null;
}

export async function listTasks(
  userId: string,
  opts: { status?: string | string[]; limit?: number; scheduledOn?: string } = {}
): Promise<Task[]> {
  const supabase = await client();
  let query = supabase
    .from("tasks")
    .select("*, domain:domains(slug, title), project:projects(title)")
    .eq("user_id", userId);

  if (opts.status) {
    const statuses = Array.isArray(opts.status) ? opts.status : [opts.status];
    query = query.in("status", statuses);
  }
  if (opts.scheduledOn) {
    query = query.eq("scheduled_date", opts.scheduledOn);
  }
  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as Task[];
}

export async function getTask(taskId: string): Promise<Task | null> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, domain:domains(slug, title), project:projects(title)")
    .eq("id", taskId)
    .maybeSingle();
  if (error) throw new RepositoryError(error.message);
  return data as Task | null;
}

export async function insertTask(task: Partial<Task>): Promise<Task> {
  const supabase = await client();
  const { data, error } = await supabase.from("tasks").insert(task).select("*").single();
  if (error) throw new RepositoryError(error.message);
  return data as Task;
}

export async function updateTask(taskId: string, patch: Record<string, unknown>): Promise<Task> {
  const supabase = await client();
  const { data, error } = await supabase.from("tasks").update(patch).eq("id", taskId).select("*").single();
  if (error) throw new RepositoryError(error.message);
  return data as Task;
}

export async function listTaskEvents(userId: string, taskId?: string, limit = 100): Promise<TaskEvent[]> {
  const supabase = await client();
  let query = supabase.from("task_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  if (taskId) query = query.eq("task_id", taskId);
  const { data, error } = await query;
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as TaskEvent[];
}

/**
 * Tasks that were marked blocked (or deferred with a "blocked" reason)
 * within the window. Used to exclude blocked work from recommendations.
 */
export async function listBlockedTaskIds(userId: string, since: string): Promise<string[]> {
  const supabase = await client();
  const { data: events, error: eventsError } = await supabase
    .from("task_events")
    .select("task_id, event_type, event_data")
    .eq("user_id", userId)
    .gte("created_at", since);
  if (eventsError) throw new RepositoryError(eventsError.message);

  const { data: friction, error: frictionError } = await supabase
    .from("friction_events")
    .select("task_id")
    .eq("user_id", userId)
    .eq("reason", "blocked")
    .gte("created_at", since);
  if (frictionError) throw new RepositoryError(frictionError.message);

  const ids = new Set<string>();
  for (const event of events ?? []) {
    if (event.event_type === "blocked") {
      if (event.task_id) ids.add(event.task_id);
      continue;
    }
    if (event.event_type === "deferred" || event.event_type === "avoidance_recorded") {
      const reason = (event.event_data as { reason?: string } | null)?.reason;
      if (reason === "blocked" && event.task_id) ids.add(event.task_id);
    }
  }
  for (const f of friction ?? []) {
    if (f.task_id) ids.add(f.task_id);
  }
  return [...ids];
}

export async function insertTaskEvent(event: {
  user_id: string;
  task_id: string | null;
  event_type: string;
  event_data?: Json;
}): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from("task_events").insert(event);
  if (error) throw new RepositoryError(error.message);
}

export async function listProjects(userId: string): Promise<Project[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("priority");
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as Project[];
}

export async function insertProject(project: Partial<Project>): Promise<Project> {
  const supabase = await client();
  const { data, error } = await supabase.from("projects").insert(project).select("*").single();
  if (error) throw new RepositoryError(error.message);
  return data as Project;
}

export async function getDailyCheckin(userId: string, date: string): Promise<DailyCheckin | null> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  if (error) throw new RepositoryError(error.message);
  return data as DailyCheckin | null;
}

export async function listDailyCheckins(userId: string, fromDate: string): Promise<DailyCheckin[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", userId)
    .gte("date", fromDate)
    .order("date", { ascending: false });
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as DailyCheckin[];
}

export async function upsertDailyCheckin(checkin: Partial<DailyCheckin> & { user_id: string; date: string }): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from("daily_checkins").upsert(checkin);
  if (error) throw new RepositoryError(error.message);
}

export async function insertWorkout(workout: Partial<Workout> & { user_id: string }): Promise<Workout> {
  const supabase = await client();
  const { data, error } = await supabase.from("workouts").insert(workout).select("*").single();
  if (error) throw new RepositoryError(error.message);
  return data as Workout;
}

export async function upsertFinancialSnapshot(snapshot: Partial<FinancialSnapshot> & { user_id: string; date: string }): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from("financial_snapshots").upsert(snapshot);
  if (error) throw new RepositoryError(error.message);
}

export async function upsertHouseProgress(progress: Partial<HouseProgress> & { user_id: string; date: string }): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from("house_progress").upsert(progress);
  if (error) throw new RepositoryError(error.message);
}

export async function listHouseProgress(userId: string, limit = 1): Promise<HouseProgress[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("house_progress")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as HouseProgress[];
}

export async function upsertWeeklyMode(mode: Partial<WeeklyMode> & { user_id: string; week_start: string }): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from("weekly_modes").upsert(mode);
  if (error) throw new RepositoryError(error.message);
}

export async function listWorkouts(userId: string, fromDate?: string, limit = 30): Promise<Workout[]> {
  const supabase = await client();
  let query = supabase.from("workouts").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(limit);
  if (fromDate) query = query.gte("date", fromDate);
  const { data, error } = await query;
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as Workout[];
}

export async function listFinancialSnapshots(userId: string, limit = 30): Promise<FinancialSnapshot[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("financial_snapshots")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as FinancialSnapshot[];
}

export async function getWeeklyReview(userId: string, weekStart: string): Promise<WeeklyReview | null> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("weekly_reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) throw new RepositoryError(error.message);
  return data as WeeklyReview | null;
}

export async function listWeeklyReviews(userId: string, limit = 8): Promise<WeeklyReview[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("weekly_reviews")
    .select("*")
    .eq("user_id", userId)
    .order("week_start", { ascending: false })
    .limit(limit);
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as WeeklyReview[];
}

export async function listFrictionEvents(userId: string, limit = 20): Promise<FrictionEvent[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("friction_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as FrictionEvent[];
}

export async function upsertWeeklyReview(review: Partial<WeeklyReview> & { user_id: string; week_start: string }): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from("weekly_reviews").upsert(review);
  if (error) throw new RepositoryError(error.message);
}

export async function listMilestones(userId: string): Promise<Milestone[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("user_id", userId)
    .order("achieved_at", { ascending: false });
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as Milestone[];
}

export async function insertMilestone(m: Partial<Milestone> & { user_id: string }): Promise<Milestone> {
  const supabase = await client();
  const { data, error } = await supabase.from("milestones").insert(m).select("*").single();
  if (error) throw new RepositoryError(error.message);
  return data as Milestone;
}

export async function listMomentumHistory(userId: string, days = 30): Promise<MomentumHistory[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("momentum_history")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(days);
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as MomentumHistory[];
}

export async function insertMomentumHistory(m: Partial<MomentumHistory> & { user_id: string; date: string; overall_score: number }): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from("momentum_history").upsert(m);
  if (error) throw new RepositoryError(error.message);
}

export async function listExperiments(userId: string): Promise<Experiment[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("experiments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as Experiment[];
}

export async function insertExperiment(e: Partial<Experiment> & { user_id: string }): Promise<Experiment> {
  const supabase = await client();
  const { data, error } = await supabase.from("experiments").insert(e).select("*").single();
  if (error) throw new RepositoryError(error.message);
  return data as Experiment;
}

export async function updateExperiment(id: string, patch: Record<string, unknown>): Promise<Experiment> {
  const supabase = await client();
  const { data, error } = await supabase.from("experiments").update(patch).eq("id", id).select("*").single();
  if (error) throw new RepositoryError(error.message);
  return data as Experiment;
}

export async function listPromises(userId: string, status?: string): Promise<Promise_[]> {
  const supabase = await client();
  let query = supabase.from("promises").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as Promise_[];
}

export async function insertPromise(p: Partial<Promise_> & { user_id: string }): Promise<Promise_> {
  const supabase = await client();
  const { data, error } = await supabase.from("promises").insert(p).select("*").single();
  if (error) throw new RepositoryError(error.message);
  return data as Promise_;
}

export async function updatePromise(id: string, patch: Record<string, unknown>): Promise<Promise_> {
  const supabase = await client();
  const { data, error } = await supabase.from("promises").update(patch).eq("id", id).select("*").single();
  if (error) throw new RepositoryError(error.message);
  return data as Promise_;
}

export async function listIdeas(userId: string): Promise<Idea[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as Idea[];
}

export async function insertIdea(i: Partial<Idea> & { user_id: string }): Promise<Idea> {
  const supabase = await client();
  const { data, error } = await supabase.from("ideas").insert(i).select("*").single();
  if (error) throw new RepositoryError(error.message);
  return data as Idea;
}

export async function updateIdea(id: string, patch: Record<string, unknown>): Promise<Idea> {
  const supabase = await client();
  const { data, error } = await supabase.from("ideas").update(patch).eq("id", id).select("*").single();
  if (error) throw new RepositoryError(error.message);
  return data as Idea;
}

export async function insertEvidence(e: Partial<Evidence> & { user_id: string }): Promise<Evidence> {
  const supabase = await client();
  const { data, error } = await supabase.from("evidence").insert(e).select("*").single();
  if (error) throw new RepositoryError(error.message);
  return data as Evidence;
}

export async function listEvidence(userId: string, limit = 50): Promise<Evidence[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("evidence")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as Evidence[];
}

export async function listConversations(userId: string): Promise<AiConversation[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as AiConversation[];
}

export async function getConversation(conversationId: string): Promise<AiConversation | null> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw new RepositoryError(error.message);
  return data as AiConversation | null;
}

export async function insertConversation(c: Partial<AiConversation> & { user_id: string }): Promise<AiConversation> {
  const supabase = await client();
  const { data, error } = await supabase.from("ai_conversations").insert(c).select("*").single();
  if (error) throw new RepositoryError(error.message);
  return data as AiConversation;
}

export async function listMessages(conversationId: string, limit = 50): Promise<AiMessage[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as AiMessage[];
}

export async function insertMessage(m: Partial<AiMessage>): Promise<AiMessage> {
  const supabase = await client();
  const { data, error } = await supabase.from("ai_messages").insert(m).select("*").single();
  if (error) throw new RepositoryError(error.message);
  return data as AiMessage;
}

export async function insertProposal(p: Partial<AiProposal> & { user_id: string }): Promise<AiProposal> {
  const supabase = await client();
  const { data, error } = await supabase.from("ai_proposals").insert(p).select("*").single();
  if (error) throw new RepositoryError(error.message);
  return data as AiProposal;
}

export async function listPendingProposals(userId: string): Promise<AiProposal[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("ai_proposals")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw new RepositoryError(error.message);
  return (data ?? []) as AiProposal[];
}

export async function updateProposal(id: string, patch: Record<string, unknown>): Promise<AiProposal> {
  const supabase = await client();
  const { data, error } = await supabase.from("ai_proposals").update(patch).eq("id", id).select("*").single();
  if (error) throw new RepositoryError(error.message);
  return data as AiProposal;
}

export async function getGoogleConnection(userId: string): Promise<GoogleConnection | null> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("google_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new RepositoryError(error.message);
  return data as GoogleConnection | null;
}

export async function upsertGoogleConnection(userId: string, patch: Partial<GoogleConnection>): Promise<void> {
  const supabase = await client();
  const { error } = await supabase
    .from("google_connections")
    .upsert({ user_id: userId, ...patch });
  if (error) throw new RepositoryError(error.message);
}

export async function listGoogleSyncRecords(userId: string): Promise<GoogleTaskSync[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("google_task_sync")
    .select("*, task:tasks!inner(user_id)")
    .eq("task.user_id", userId);
  if (error) throw new RepositoryError(error.message);
  const records = (data ?? []) as (GoogleTaskSync & { task: { user_id: string } })[];
  return records.filter((r) => r.task.user_id === userId);
}

export async function upsertGoogleSyncRecord(_userId: string, record: Partial<GoogleTaskSync> & { task_id: string }): Promise<void> {
  const supabase = await client();
  const { error } = await supabase
    .from("google_task_sync")
    .upsert(record);
  if (error) throw new RepositoryError(error.message);
}