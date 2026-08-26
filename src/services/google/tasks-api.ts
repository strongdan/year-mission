import "server-only";
import { YEAR_MISSION_TASKLIST, type GoogleTaskLike } from "@/domain/google-sync";

const BASE = "https://tasks.googleapis.com/tasks/v1";
const ERROR_TEXT: Record<number, string> = {
  400: "Google rejected the request.",
  401: "Google access token expired or invalid.",
  403: "Google denied access to Tasks.",
  404: "The Google task list or task no longer exists.",
};

async function api<T>(accessToken: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(ERROR_TEXT[res.status] ?? `Google Tasks API failed (${res.status}).`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface TaskList {
  id: string;
  title: string;
}

export interface GoogleTask extends GoogleTaskLike {
  id: string;
  title: string;
  status: string;
  notes?: string | null;
  due?: string | null;
  updated?: string | null;
  completed?: string | null;
  hidden?: boolean;
}

export async function listTaskLists(accessToken: string): Promise<TaskList[]> {
  const lists: TaskList[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({ maxResults: "100" });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await api<{ items?: TaskList[]; nextPageToken?: string }>(accessToken, `/users/@me/lists?${params.toString()}`);
    lists.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return lists;
}

export async function findOrCreateYearMissionList(accessToken: string): Promise<TaskList> {
  const lists = await listTaskLists(accessToken);
  const existing = lists.find((l) => l.title === YEAR_MISSION_TASKLIST);
  if (existing) return existing;
  return api<TaskList>(accessToken, `/users/@me/lists`, {
    method: "POST",
    body: JSON.stringify({ title: YEAR_MISSION_TASKLIST }),
  });
}

export async function listGoogleTasks(accessToken: string, tasklistId: string): Promise<GoogleTask[]> {
  const tasks: GoogleTask[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      showCompleted: "true",
      showHidden: "true",
      maxResults: "100",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await api<{ items?: GoogleTask[]; nextPageToken?: string }>(
      accessToken,
      `/lists/${encodeURIComponent(tasklistId)}/tasks?${params.toString()}`
    );
    tasks.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return tasks;
}

export async function createGoogleTask(
  accessToken: string,
  tasklistId: string,
  payload: { title: string; notes?: string; due?: string | null; status?: string }
): Promise<GoogleTask> {
  return api<GoogleTask>(accessToken, `/lists/${encodeURIComponent(tasklistId)}/tasks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateGoogleTask(
  accessToken: string,
  tasklistId: string,
  taskId: string,
  payload: { title: string; notes?: string; due?: string | null; status?: string }
): Promise<GoogleTask> {
  return api<GoogleTask>(
    accessToken,
    `/lists/${encodeURIComponent(tasklistId)}/tasks/${encodeURIComponent(taskId)}`,
    { method: "PUT", body: JSON.stringify(payload) }
  );
}

export async function deleteGoogleTask(accessToken: string, tasklistId: string, taskId: string): Promise<void> {
  await api<void>(accessToken, `/lists/${encodeURIComponent(tasklistId)}/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" });
}
