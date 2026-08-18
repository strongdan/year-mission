import type { AiAction } from "@/domain/ai-actions";
import { updateTask, insertTaskEvent, getTask } from "@/repositories/supabase-repository";
import { canTransition, transitionTask } from "@/domain/task-states";
import { canAddToToday, canAddToWeek } from "@/domain/wip";
import type { WeekMode } from "@/domain/constants";

export interface ActionOutcome {
  ok: boolean;
  message: string;
  taskId?: string;
}

export async function applyAiAction(action: AiAction): Promise<ActionOutcome> {
  switch (action.action) {
    case "reschedule_task":
      return rescheduleTask(action.task_id, action.new_date);
    case "promote_to_week":
      return promoteToWeek(action.task_id);
    case "promote_to_today":
      return promoteToToday(action.task_id);
    case "set_weekly_win":
      return setWeeklyWin(action.task_id);
    case "change_task_status":
      return changeStatus(action.task_id, action.to_status);
    case "update_task":
      return updateTaskFields(action.task_id, action.payload);
    default:
      return { ok: false, message: `Action "${action.action}" not yet executable server-side.` };
  }
}

async function rescheduleTask(taskId: string, newDate: string): Promise<ActionOutcome> {
  const task = await getTask(taskId);
  if (!task) return { ok: false, message: "Task not found." };
  await updateTask(taskId, { scheduled_date: newDate });
  await insertTaskEvent({
    user_id: task.user_id,
    task_id: task.id,
    event_type: "scheduled",
    event_data: { scheduled_date: newDate },
  });
  return { ok: true, message: "Task rescheduled.", taskId };
}

async function promoteToWeek(taskId: string): Promise<ActionOutcome> {
  const task = await getTask(taskId);
  if (!task) return { ok: false, message: "Task not found." };
  if (!canTransition(task.status, "this_week")) {
    return { ok: false, message: `Cannot promote a "${task.status}" task to This Week.` };
  }
  const weekCount = await countByStatus(task.user_id, "this_week");
  const decision = canAddToWeek(weekCount);
  if (!decision.allowed) return { ok: false, message: "This Week is full. Replace or defer a task first." };
  await updateTask(taskId, { status: "this_week" });
  await logStatusEvent(task, "this_week");
  return { ok: true, message: "Promoted to This Week.", taskId };
}

async function promoteToToday(taskId: string): Promise<ActionOutcome> {
  const task = await getTask(taskId);
  if (!task) return { ok: false, message: "Task not found." };
  if (!canTransition(task.status, "today")) {
    return { ok: false, message: `Cannot move a "${task.status}" task to Today.` };
  }
  const todayCount = await countByStatus(task.user_id, "today");
  const decision = canAddToToday(todayCount);
  if (!decision.allowed) return { ok: false, message: "Today is full. Replace or finish a task first." };
  await updateTask(taskId, { status: "today" });
  await logStatusEvent(task, "today");
  return { ok: true, message: "Moved to Today.", taskId };
}

async function setWeeklyWin(taskId: string): Promise<ActionOutcome> {
  const task = await getTask(taskId);
  if (!task) return { ok: false, message: "Task not found." };
  await updateTask(taskId, { weekly_win: true, status: task.status === "completed" ? "completed" : "this_week" });
  return { ok: true, message: "Weekly Win selected.", taskId };
}

async function changeStatus(taskId: string, toStatus: string): Promise<ActionOutcome> {
  const task = await getTask(taskId);
  if (!task) return { ok: false, message: "Task not found." };
  const transition = transitionTask(task.status, toStatus as Parameters<typeof transitionTask>[1]);
  if (!transition) return { ok: false, message: `Invalid transition from ${task.status} to ${toStatus}.` };
  await updateTask(taskId, {
    status: toStatus,
    ...(toStatus === "completed" ? { completed_at: new Date().toISOString() } : {}),
  });
  await logStatusEvent(task, toStatus, transition.event);
  return { ok: true, message: `Task moved to ${toStatus}.`, taskId };
}

async function updateTaskFields(
  taskId: string,
  payload: { title?: string; notes?: string; estimated_minutes?: number; scheduled_date?: string | null; due_date?: string | null; impact?: string }
): Promise<ActionOutcome> {
  const task = await getTask(taskId);
  if (!task) return { ok: false, message: "Task not found." };
  await updateTask(taskId, payload);
  await insertTaskEvent({ user_id: task.user_id, task_id: task.id, event_type: "resized", event_data: { payload } });
  return { ok: true, message: "Task updated.", taskId };
}

async function countByStatus(userId: string, status: string): Promise<number> {
  const { createServerClientForApp } = await import("@/integrations/supabase/server");
  const supabase = await createServerClientForApp();
  if (!supabase) return 0;
  const { count } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", status);
  return count ?? 0;
}

async function logStatusEvent(task: { id: string; user_id: string }, toStatus: string, event = "status_changed") {
  await insertTaskEvent({ user_id: task.user_id, task_id: task.id, event_type: event, event_data: { to_status: toStatus } });
}

export async function getWeekMode(userId: string): Promise<WeekMode> {
  const { createServerClientForApp } = await import("@/integrations/supabase/server");
  const supabase = await createServerClientForApp();
  if (!supabase) return "normal";
  const { data } = await supabase.from("weekly_modes").select("mode").eq("user_id", userId).order("week_start", { ascending: false }).limit(1).maybeSingle();
  return (data?.mode as WeekMode) ?? "normal";
}