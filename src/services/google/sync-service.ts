import "server-only";
import { refreshAccessToken } from "./oauth";
import { encryptToken, decryptToken } from "./encryption";
import { isGoogleTasksConfigured } from "./config";
import { clearGoogleConnectionCredentials, upsertGoogleConnectionForUser } from "./connection-store";
import { googleReconnectMessage, isGoogleReconnectRequired } from "./token-errors";
import { findOrCreateYearMissionList, listGoogleTasks, createGoogleTask, updateGoogleTask, type GoogleTask } from "./tasks-api";
import { listPrimaryCalendarEvents, type GoogleCalendarEvent } from "./calendar-api";
import {
  fromGoogleTask,
  toGoogleTask,
  resolveSyncConflict,
  summarize,
  GOOGLE_TASKS_SOURCE,
  GOOGLE_CALENDAR_SCOPE,
  type LocalTaskLike,
  type SyncSummary,
} from "@/domain/google-sync";
import { ACTIVE_STATUSES } from "@/domain/task-states";
import { getGoogleConnection, listGoogleSyncRecords, upsertGoogleSyncRecord, listTasks, updateTask, insertTask } from "@/repositories/supabase-repository";
import type { GoogleTaskSync } from "@/types/models";

export type SyncOutcome = "not_configured" | "not_connected" | "error" | "ok";

export interface SyncResult {
  outcome: SyncOutcome;
  error?: string;
  summary?: SyncSummary;
}

export interface CalendarWeekResult {
  outcome: SyncOutcome;
  events: GoogleCalendarEvent[];
  needsReconnect: boolean;
  error?: string;
}

async function accessTokenForConnection(userId: string): Promise<{ accessToken: string; scope: string } | null> {
  const connection = await getGoogleConnection(userId);
  if (!connection?.refresh_token) return null;

  try {
    const accessToken = await refreshAccessToken(decryptToken(connection.refresh_token));
    return { accessToken, scope: connection.scope ?? "" };
  } catch (error) {
    if (isGoogleReconnectRequired(error)) {
      await clearGoogleConnectionCredentials(userId);
      throw new Error(googleReconnectMessage());
    }
    throw error;
  }
}

export async function getGoogleCalendarWeek(userId: string, weekStart: string): Promise<CalendarWeekResult> {
  if (!isGoogleTasksConfigured()) {
    return { outcome: "not_configured", events: [], needsReconnect: false };
  }

  const connection = await getGoogleConnection(userId);
  if (!connection?.refresh_token) {
    return { outcome: "not_connected", events: [], needsReconnect: false };
  }

  if (!connection.scope?.includes(GOOGLE_CALENDAR_SCOPE)) {
    return {
      outcome: "error",
      events: [],
      needsReconnect: true,
      error: "Reconnect Google once to add read-only Calendar access.",
    };
  }

  try {
    const access = await accessTokenForConnection(userId);
    if (!access) return { outcome: "not_connected", events: [], needsReconnect: false };
    const start = new Date(`${weekStart}T00:00:00Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    const events = await listPrimaryCalendarEvents(access.accessToken, start.toISOString(), end.toISOString());
    return { outcome: "ok", events, needsReconnect: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Calendar could not be loaded.";
    const needsReconnect = isGoogleReconnectRequired(error) || message === googleReconnectMessage() || message.toLowerCase().includes("permission");
    return { outcome: "error", events: [], needsReconnect, error: needsReconnect ? googleReconnectMessage() : message };
  }
}

export async function syncGoogleTasks(userId: string): Promise<SyncResult> {
  if (!isGoogleTasksConfigured()) return { outcome: "not_configured" };

  let accessToken: string;
  try {
    const access = await accessTokenForConnection(userId);
    if (!access) return { outcome: "not_connected" };
    accessToken = access.accessToken;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to refresh Google token.";
    const reconnect = isGoogleReconnectRequired(error) || message === googleReconnectMessage();
    return { outcome: "error", error: reconnect ? googleReconnectMessage() : message };
  }

  try {
    const tasklist = await findOrCreateYearMissionList(accessToken);
    const googleTasks = await listGoogleTasks(accessToken, tasklist.id);

    const active = await listTasks(userId, { status: ACTIVE_STATUSES });
    const localTasks = [...active] as LocalTaskLike[];
    const records = await listGoogleSyncRecords(userId);

    const recordByTask = new Map<string, GoogleTaskSync>(records.map((r) => [r.task_id, r]));
    const googleById = new Map<string, GoogleTask>(googleTasks.map((g) => [g.id, g]));

    const results: { action: "pull" | "push" | "update" | "conflict" }[] = [];
    const now = new Date().toISOString();

    for (const task of localTasks) {
      const record = recordByTask.get(task.id);
      const localDone = task.status === "completed";

      if (!record) {
        if (localDone) continue;
        const created = await createGoogleTask(accessToken, tasklist.id, toGoogleTask(task));
        await upsertGoogleSyncRecord(userId, {
          task_id: task.id,
          google_task_id: created.id,
          google_tasklist_id: tasklist.id,
          local_updated_at: task.updated_at ?? now,
          google_updated_at: created.updated ?? now,
          sync_status: "synced",
          last_synced_at: now,
        });
        results.push({ action: "push" });
        continue;
      }

      const googleTask = record.google_task_id ? googleById.get(record.google_task_id) : undefined;
      if (!googleTask) {
        if (!localDone) {
          const created = await createGoogleTask(accessToken, tasklist.id, toGoogleTask(task));
          await upsertGoogleSyncRecord(userId, {
            task_id: task.id,
            google_task_id: created.id,
            google_tasklist_id: tasklist.id,
            local_updated_at: task.updated_at ?? now,
            google_updated_at: created.updated ?? now,
            sync_status: "synced",
            last_synced_at: now,
          });
          results.push({ action: "push" });
        }
        continue;
      }

      const winner = resolveSyncConflict(task.updated_at, googleTask.updated);
      const googleDone = googleTask.status === "completed";
      const localMapped = toGoogleTask(task);

      if (winner === "google") {
        const local = fromGoogleTask(googleTask);
        const patch: Record<string, unknown> = {
          title: local.title,
          notes: local.notes,
          scheduled_date: local.scheduled_date,
        };
        if (localDone !== local.completed) {
          patch.status = local.completed ? "completed" : "today";
          patch.completed_at = local.completed ? (googleTask.completed ?? now) : null;
        }
        await updateTask(task.id, patch);
        results.push({ action: "update" });
      } else {
        const changed =
          googleTask.title !== localMapped.title ||
          (googleTask.notes ?? undefined) !== localMapped.notes ||
          (googleTask.due ?? undefined) !== localMapped.due ||
          googleDone !== localDone;
        if (changed) {
          await updateGoogleTask(accessToken, tasklist.id, googleTask.id, localMapped);
          results.push({ action: "update" });
        }
      }

      await upsertGoogleSyncRecord(userId, {
        task_id: task.id,
        google_task_id: googleTask.id,
        google_tasklist_id: tasklist.id,
        local_updated_at: task.updated_at ?? now,
        google_updated_at: googleTask.updated ?? now,
        sync_status: winner === "google" && localDone !== googleDone ? "conflict" : "synced",
        last_synced_at: now,
      });
    }

    for (const googleTask of googleTasks) {
      const matched = [...recordByTask.values()].some((r) => r.google_task_id === googleTask.id);
      if (matched) continue;
      const local = fromGoogleTask(googleTask);
      const created = await insertTask({
        user_id: userId,
        title: local.title,
        notes: local.notes,
        scheduled_date: local.scheduled_date,
        status: local.completed ? "completed" : "inbox",
        source: GOOGLE_TASKS_SOURCE,
        completed_at: local.completed ? (googleTask.completed ?? now) : null,
      });
      await upsertGoogleSyncRecord(userId, {
        task_id: created.id,
        google_task_id: googleTask.id,
        google_tasklist_id: tasklist.id,
        local_updated_at: created.updated_at,
        google_updated_at: googleTask.updated ?? now,
        sync_status: "synced",
        last_synced_at: now,
      });
      results.push({ action: "pull" });
    }

    return {
      outcome: "ok",
      summary: { ...summarize(results), tasklistId: tasklist.id },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google sync failed.";
    const reconnect = isGoogleReconnectRequired(error) || message === googleReconnectMessage();
    if (reconnect) await clearGoogleConnectionCredentials(userId);
    return { outcome: "error", error: reconnect ? googleReconnectMessage() : message };
  }
}

export async function connectGoogleTasksUrl(userId: string): Promise<{ url: string } | { error: string }> {
  if (!isGoogleTasksConfigured()) {
    return { error: "Google Tasks is not configured on the server." };
  }
  const { buildAuthUrl } = await import("./oauth");
  return { url: buildAuthUrl(userId) };
}

export async function storeGoogleConnection(
  userId: string,
  opts: { refreshToken: string; email: string; googleUserId: string; scope: string }
) {
  await upsertGoogleConnectionForUser(userId, {
    refresh_token: encryptToken(opts.refreshToken),
    token_encrypted: true,
    email: opts.email,
    google_user_id: opts.googleUserId,
    scope: opts.scope,
  });
}

export async function disconnectGoogleTasks(userId: string): Promise<void> {
  await clearGoogleConnectionCredentials(userId);
}
