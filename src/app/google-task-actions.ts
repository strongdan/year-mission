"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { addGoogleTaskForUser, getGoogleTaskHub, removeGoogleTaskForUser } from "@/services/google/task-hub";

const TASK_KEY_Z = z.object({
  tasklistId: z.string().min(1),
  taskId: z.string().min(1),
});

const ADD_TASK_Z = z.object({
  tasklistId: z.string().min(1),
  title: z.string().trim().min(1).max(1024),
  notes: z.string().max(8192).optional(),
});

export async function getGoogleTaskHubAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." } as const;
  try {
    const data = await getGoogleTaskHub(user.id);
    return { ok: true, data } as const;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Google Tasks could not be loaded." } as const;
  }
}

export async function addGoogleTaskAction(raw: unknown) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." } as const;
  const parsed = ADD_TASK_Z.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Choose a list and enter a task title." } as const;
  try {
    await addGoogleTaskForUser(user.id, parsed.data);
    revalidatePath("/tasks");
    return { ok: true } as const;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Google task could not be added." } as const;
  }
}

export async function removeGoogleTaskAction(raw: unknown) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." } as const;
  const parsed = TASK_KEY_Z.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid Google task." } as const;
  try {
    await removeGoogleTaskForUser(user.id, parsed.data);
    revalidatePath("/tasks");
    return { ok: true } as const;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Google task could not be removed." } as const;
  }
}
