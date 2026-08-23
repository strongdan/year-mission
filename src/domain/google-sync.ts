export const GOOGLE_TASKS_SCOPE = "https://www.googleapis.com/auth/tasks";
export const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
export const GOOGLE_IDENTITY_SCOPES = ["openid", "email"] as const;
export const GOOGLE_SCOPES = [...GOOGLE_IDENTITY_SCOPES, GOOGLE_TASKS_SCOPE, GOOGLE_CALENDAR_SCOPE].join(" ");
export const YEAR_MISSION_TASKLIST = "Year Mission";
export const GOOGLE_TASKS_SOURCE = "google_tasks";
export const NOTES_MARKER = "[Year Mission]";

export interface GoogleTaskLike {
  id: string;
  title: string;
  notes?: string | null;
  due?: string | null;
  status: string;
  updated?: string | null;
}

export interface LocalTaskLike {
  id: string;
  title: string;
  notes?: string | null;
  scheduled_date?: string | null;
  due_date?: string | null;
  status: string;
  domain?: { slug: string; title: string } | null;
  project?: { title: string } | null;
  updated_at?: string | null;
}

export function withMarker(notes: string | null | undefined): string | undefined {
  const base = notes?.trim() || "";
  const marked = base ? `[Year Mission] ${base}` : "[Year Mission]";
  return marked;
}

export function stripMarker(notes: string | null | undefined): string | null {
  if (!notes) return null;
  return notes.replace(/^\[Year Mission\]\s*/i, "").trim() || null;
}

export function isMarked(notes: string | null | undefined): boolean {
  return !!notes && /^\[Year Mission\]/i.test(notes.trim());
}

export function localDateToGoogleDue(date: string | null | undefined): string | null {
  if (!date) return null;
  return `${date}T00:00:00.000Z`;
}

export function googleDueToLocalDate(due: string | null | undefined): string | null {
  if (!due) return null;
  const match = due.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

export function toGoogleTask(task: LocalTaskLike): { title: string; notes: string | undefined; due: string | null; status: string } {
  const parts: string[] = [];
  if (task.domain) parts.push(task.domain.title);
  if (task.project) parts.push(`Project: ${task.project.title}`);
  const notes = withMarker(parts.length ? `${parts.join(" · ")}${task.notes ? `\n\n${task.notes}` : ""}` : task.notes);
  return {
    title: task.title,
    notes,
    due: localDateToGoogleDue(task.scheduled_date ?? task.due_date),
    status: task.status === "completed" ? "completed" : "needsAction",
  };
}

export function fromGoogleTask(gt: GoogleTaskLike): {
  title: string;
  notes: string | null;
  scheduled_date: string | null;
  completed: boolean;
} {
  return {
    title: gt.title,
    notes: stripMarker(gt.notes),
    scheduled_date: googleDueToLocalDate(gt.due),
    completed: gt.status === "completed",
  };
}

export function resolveSyncConflict(localUpdated: string | null | undefined, googleUpdated: string | null | undefined, preferLocalOnTie = true): "local" | "google" {
  const local = localUpdated ? new Date(localUpdated).getTime() : 0;
  const google = googleUpdated ? new Date(googleUpdated).getTime() : 0;
  if (google > local) return "google";
  if (local > google) return "local";
  return preferLocalOnTie ? "local" : "google";
}

export interface SyncSummary {
  pulled: number;
  pushed: number;
  updated: number;
  conflicts: number;
  tasklistId: string;
}

export function summarize(results: { action: "pull" | "push" | "update" | "conflict" }[]): Omit<SyncSummary, "tasklistId"> {
  return {
    pulled: results.filter((r) => r.action === "pull").length,
    pushed: results.filter((r) => r.action === "push").length,
    updated: results.filter((r) => r.action === "update").length,
    conflicts: results.filter((r) => r.action === "conflict").length,
  };
}
