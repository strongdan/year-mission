import {
  listTasks,
  insertTask,
  updateTask,
  insertTaskEvent,
  getTask,
  insertProject,
  listProjects,
  updateExperiment,
  listExperiments,
  insertEvidence,
  insertMilestone,
} from "@/repositories/supabase-repository";
import {
  canAddToToday,
  canAddToWeek,
} from "@/domain/wip";
import {
  transitionTask,
} from "@/domain/task-states";
import { DEFERRAL_ACTION_MAP } from "@/domain/deferral";
import type { DeferralReason } from "@/domain/constants";
import { assertActiveExperimentLimit } from "@/domain/experiments";
import { isMetaWork } from "@/domain/meta-work";
import type { Json } from "@/integrations/supabase/types";

export interface CreateTaskInput {
  title: string;
  domainId?: string | null;
  notes?: string;
  estimatedMinutes?: number;
  scheduledDate?: string | null;
  dueDate?: string | null;
  courageTask?: boolean;
  metaWork?: boolean;
  impact?: "low" | "medium" | "high";
  source?: string;
}

export interface ServiceResult<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
}

export class TaskService {
  async create(userId: string, input: CreateTaskInput): Promise<ServiceResult> {
    if (!input.title.trim()) return { ok: false, error: "Title is required." };

    const meta = input.metaWork ?? isMetaWork(input.title).isMetaWork;

    const task = await insertTask({
      user_id: userId,
      title: input.title.trim(),
      notes: input.notes ?? null,
      status: "inbox",
      domain_id: input.domainId ?? null,
      estimated_minutes: input.estimatedMinutes ?? null,
      scheduled_date: input.scheduledDate ?? null,
      due_date: input.dueDate ?? null,
      courage_task: input.courageTask ?? false,
      meta_work: meta,
      impact: input.impact ?? "medium",
      source: input.source ?? "manual",
    });

    await insertTaskEvent({
      user_id: userId,
      task_id: task.id,
      event_type: "created",
      event_data: { meta_work: meta },
    });

    return { ok: true, data: task };
  }

  async addToWeek(userId: string, taskId: string): Promise<ServiceResult> {
    const task = await getTask(taskId);
    if (!task) return { ok: false, error: "Task not found." };
    if (task.status !== "inbox" && task.status !== "backlog") {
      return { ok: false, error: "Only Inbox or Backlog tasks can be promoted to This Week." };
    }

    const weekCount = await countStatus(userId, "this_week");
    const decision = canAddToWeek(weekCount);
    if (!decision.allowed) return { ok: false, error: "This Week is full. Replace or defer a task first." };

    await updateTask(taskId, { status: "this_week" });
    await insertTaskEvent({ user_id: userId, task_id: taskId, event_type: "status_changed", event_data: { to_status: "this_week" } });
    return { ok: true };
  }

  async addToToday(userId: string, taskId: string): Promise<ServiceResult> {
    const task = await getTask(taskId);
    if (!task) return { ok: false, error: "Task not found." };
    const transition = transitionTask(task.status, "today");
    if (!transition) return { ok: false, error: `Cannot move a "${task.status}" task to Today.` };

    const todayCount = await countStatus(userId, "today");
    const decision = canAddToToday(todayCount);
    if (!decision.allowed) return { ok: false, error: "Today is full. Finish or replace a task first." };

    await updateTask(taskId, { status: "today" });
    await insertTaskEvent({ user_id: userId, task_id: taskId, event_type: "status_changed", event_data: { to_status: "today" } });
    return { ok: true };
  }

  async complete(userId: string, taskId: string): Promise<ServiceResult> {
    const task = await getTask(taskId);
    if (!task) return { ok: false, error: "Task not found." };
    const transition = transitionTask(task.status, "completed");
    if (!transition) return { ok: false, error: `Task in "${task.status}" cannot be completed.` };

    await updateTask(taskId, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });
    await insertTaskEvent({ user_id: userId, task_id: taskId, event_type: "completed" });

    if (task.courage_task) {
      await insertEvidence({
        user_id: userId,
        domain_id: task.domain_id,
        type: "courage",
        title: task.title,
        description: "Completed an uncomfortable-but-important task.",
        source_type: "task",
        source_id: task.id,
        significance: 3,
      });
    }
    if (task.defer_count > 0) {
      await insertEvidence({
        user_id: userId,
        domain_id: task.domain_id,
        type: "avoidance_overcome",
        title: task.title,
        description: `Completed a task deferred ${task.defer_count} time(s).`,
        source_type: "task",
        source_id: task.id,
        significance: 2,
      });
    }

    return { ok: true };
  }

  async defer(userId: string, taskId: string, reason: DeferralReason, note?: string): Promise<ServiceResult> {
    const task = await getTask(taskId);
    if (!task) return { ok: false, error: "Task not found." };

    const newDeferCount = task.defer_count + 1;
    const targetStatus = task.status === "today" || task.status === "in_progress" ? "this_week" : task.status;

    await updateTask(taskId, {
      defer_count: newDeferCount,
      status: targetStatus,
      scheduled_date: null,
    });

    await insertTaskEvent({
      user_id: userId,
      task_id: taskId,
      event_type: "deferred",
      event_data: { reason, note: note ?? null, defer_count: newDeferCount, suggested_actions: DEFERRAL_ACTION_MAP[reason] },
    });
    if (reason) {
      await insertTaskEvent({
        user_id: userId,
        task_id: taskId,
        event_type: "avoidance_recorded",
        event_data: { reason, note: note ?? null },
      });
    }

    return { ok: true, data: { deferralIntervention: reason ? DEFERRAL_ACTION_MAP[reason] : [] } };
  }

  async drop(userId: string, taskId: string): Promise<ServiceResult> {
    const task = await getTask(taskId);
    if (!task) return { ok: false, error: "Task not found." };
    const transition = transitionTask(task.status, "dropped");
    if (!transition) return { ok: false, error: "This task cannot be dropped." };

    await updateTask(taskId, { status: "dropped" });
    await insertTaskEvent({ user_id: userId, task_id: taskId, event_type: "dropped" });
    return { ok: true };
  }

  async update(taskId: string, patch: Partial<{ title: string; notes: string; estimated_minutes: number; scheduled_date: string | null; due_date: string | null }>): Promise<ServiceResult> {
    const task = await getTask(taskId);
    if (!task) return { ok: false, error: "Task not found." };
    await updateTask(taskId, patch);
    await insertTaskEvent({ user_id: task.user_id, task_id: task.id, event_type: "resized", event_data: patch as Json });
    return { ok: true };
  }

  async createProject(userId: string, input: { title: string; description?: string; domainId?: string | null }): Promise<ServiceResult> {
    const project = await insertProject({
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      domain_id: input.domainId ?? null,
      status: "active",
    });
    return { ok: true, data: project };
  }

  async list(userId: string) {
    const [inbox, week, today, completed, projects] = await Promise.all([
      listTasks(userId, { status: "inbox" }),
      listTasks(userId, { status: "this_week" }),
      listTasks(userId, { status: "today" }),
      listTasks(userId, { status: "completed", limit: 20 }),
      listProjects(userId),
    ]);
    const backlog = await listTasks(userId, { status: "backlog" });
    return { inbox, week, today, backlog, completed, projects };
  }
}

export class ExperimentService {
  async activate(userId: string, experimentId: string): Promise<ServiceResult> {
    const experiments = await listExperiments(userId);
    const activeCount = experiments.filter((e) => e.status === "active").length;
    const limit = assertActiveExperimentLimit(activeCount);
    if (!limit.allowed) return { ok: false, error: limit.message };

    await updateExperiment(experimentId, { status: "active" });
    return { ok: true };
  }
}

export class MilestoneService {
  async create(userId: string, input: { title: string; description?: string; domainId?: string | null; achievedAt?: string }) {
    return insertMilestone({
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      domain_id: input.domainId ?? null,
      achieved_at: input.achievedAt ?? new Date().toISOString().slice(0, 10),
    });
  }
}

async function countStatus(userId: string, status: string): Promise<number> {
  const tasks = await listTasks(userId, { status });
  return tasks.length;
}

export const taskService = new TaskService();
export const experimentService = new ExperimentService();
export const milestoneService = new MilestoneService();