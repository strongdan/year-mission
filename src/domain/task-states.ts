import type { TaskStatus } from "./constants";

export const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  inbox: ["backlog", "this_week", "dropped"],
  backlog: ["this_week", "inbox", "dropped"],
  this_week: ["today", "backlog", "inbox", "dropped", "completed"],
  today: ["in_progress", "this_week", "backlog", "dropped", "completed"],
  in_progress: ["today", "completed", "dropped"],
  completed: ["inbox"],
  dropped: ["inbox"],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return TASK_TRANSITIONS[from]?.includes(to) ?? false;
}

export function validTransitions(status: TaskStatus): TaskStatus[] {
  return TASK_TRANSITIONS[status] ?? [];
}

export interface TransitionResult {
  from: TaskStatus;
  to: TaskStatus;
  event: "completed" | "dropped" | "status_changed" | "deferred";
}

export function transitionTask(from: TaskStatus, to: TaskStatus): TransitionResult | null {
  if (!canTransition(from, to)) return null;
  let event: TransitionResult["event"] = "status_changed";
  if (to === "completed") event = "completed";
  else if (to === "dropped") event = "dropped";
  else if (from === "today" && to === "this_week") event = "deferred";
  return { from, to, event };
}

export const ACTIVE_STATUSES: TaskStatus[] = ["inbox", "backlog", "this_week", "today", "in_progress"];