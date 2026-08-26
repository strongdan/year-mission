import "server-only";
import { getGoogleConnection } from "@/repositories/supabase-repository";
import { decryptToken } from "./encryption";
import { refreshAccessToken } from "./oauth";
import {
  createGoogleTask,
  deleteGoogleTask,
  listGoogleTasks,
  listTaskLists,
  type GoogleTask,
  type TaskList,
} from "./tasks-api";

export interface GoogleTaskHubItem extends GoogleTask {
  tasklistId: string;
  tasklistTitle: string;
}

export interface GoogleTaskHubData {
  lists: TaskList[];
  tasks: GoogleTaskHubItem[];
}

async function accessTokenForUser(userId: string): Promise<string> {
  const connection = await getGoogleConnection(userId);
  if (!connection?.refresh_token) throw new Error("Connect Google first.");
  return refreshAccessToken(decryptToken(connection.refresh_token));
}

export async function getGoogleTaskHub(userId: string): Promise<GoogleTaskHubData> {
  const accessToken = await accessTokenForUser(userId);
  const lists = await listTaskLists(accessToken);
  const taskGroups = await Promise.all(
    lists.map(async (list) => {
      const tasks = await listGoogleTasks(accessToken, list.id);
      return tasks.map((task) => ({ ...task, tasklistId: list.id, tasklistTitle: list.title }));
    })
  );
  const tasks = taskGroups
    .flat()
    .sort((a, b) => {
      const aDone = a.status === "completed" ? 1 : 0;
      const bDone = b.status === "completed" ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      const due = (a.due ?? "9999").localeCompare(b.due ?? "9999");
      if (due !== 0) return due;
      return a.title.localeCompare(b.title);
    });
  return { lists, tasks };
}

export async function addGoogleTaskForUser(userId: string, input: { tasklistId: string; title: string; notes?: string }) {
  const accessToken = await accessTokenForUser(userId);
  const title = input.title.trim();
  if (!title) throw new Error("Task title is required.");
  return createGoogleTask(accessToken, input.tasklistId, { title, notes: input.notes?.trim() || undefined });
}

export async function removeGoogleTaskForUser(userId: string, input: { tasklistId: string; taskId: string }) {
  const accessToken = await accessTokenForUser(userId);
  await deleteGoogleTask(accessToken, input.tasklistId, input.taskId);
}
