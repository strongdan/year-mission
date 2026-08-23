"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createServerClientForApp } from "@/integrations/supabase/server";
import { getProfile, insertTaskEvent, insertWorkout, listTaskEvents } from "@/repositories/supabase-repository";
import { taskService } from "@/services/task-service";
import type { Json } from "@/integrations/supabase/types";
import { DEFAULT_EQUIPMENT, type EquipmentId } from "@/domain/execution-protocols";

const EQUIPMENT_Z = z.enum([
  "bodyweight",
  "dumbbells",
  "bench",
  "bands",
  "pull_up_bar",
  "barbell",
  "rack",
  "cable_machine",
]);

const MEDIA_Z = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  url: z.string().min(1).max(2048),
  type: z.enum(["audio", "video", "external"]),
});

const SETTINGS_Z = z.object({
  equipment: z.array(EQUIPMENT_Z).max(8),
  pumpClubUrl: z.string().max(2048),
  audiobookshelfUrl: z.string().max(2048),
  hypnosisMedia: z.array(MEDIA_Z).max(20),
});

const LOG_Z = z.object({
  protocolId: z.string().min(1).max(80),
  kind: z.enum(["strength", "mobility", "meditation", "hypnosis", "routine"]),
  durationSeconds: z.number().int().min(0).max(12 * 60 * 60),
  taskId: z.string().uuid().nullable().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export interface HypnosisMediaItem {
  id: string;
  title: string;
  url: string;
  type: "audio" | "video" | "external";
}

export interface ExecutionSettings {
  equipment: EquipmentId[];
  pumpClubUrl: string;
  audiobookshelfUrl: string;
  hypnosisMedia: HypnosisMediaItem[];
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function normalizeSettings(value: unknown): ExecutionSettings {
  const raw = asObject(value);
  const execution = asObject(raw.execution);
  const parsed = SETTINGS_Z.safeParse({
    equipment: execution.equipment ?? DEFAULT_EQUIPMENT,
    pumpClubUrl: execution.pumpClubUrl ?? "",
    audiobookshelfUrl: execution.audiobookshelfUrl ?? process.env.AUDIOBOOKSHELF_URL ?? "",
    hypnosisMedia: execution.hypnosisMedia ?? [],
  });
  if (parsed.success) return parsed.data as ExecutionSettings;
  return {
    equipment: DEFAULT_EQUIPMENT,
    pumpClubUrl: "",
    audiobookshelfUrl: process.env.AUDIOBOOKSHELF_URL ?? "",
    hypnosisMedia: [],
  };
}

export async function getExecutionSettingsAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." } as const;
  const profile = await getProfile(user.id);
  return {
    ok: true,
    data: {
      settings: normalizeSettings(profile?.preferences),
      audiobookshelfServerConfigured: Boolean(process.env.AUDIOBOOKSHELF_URL),
    },
  } as const;
}

export async function saveExecutionSettingsAction(input: ExecutionSettings) {
  const parsed = SETTINGS_Z.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Execution settings are invalid." } as const;
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." } as const;

  const profile = await getProfile(user.id);
  const preferences = asObject(profile?.preferences);
  const nextPreferences = {
    ...preferences,
    execution: parsed.data,
  };

  const supabase = await createServerClientForApp();
  if (!supabase) return { ok: false, error: "Database is not configured." } as const;
  const { error } = await supabase.from("profiles").update({ preferences: nextPreferences }).eq("id", user.id);
  if (error) return { ok: false, error: error.message } as const;
  revalidatePath("/settings");
  return { ok: true, data: parsed.data as ExecutionSettings } as const;
}

export async function logExecutionAction(input: z.infer<typeof LOG_Z>) {
  const parsed = LOG_Z.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Execution log is invalid." } as const;
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." } as const;

  const details = JSON.parse(JSON.stringify(parsed.data.details ?? {})) as Json;
  await insertTaskEvent({
    user_id: user.id,
    task_id: parsed.data.taskId ?? null,
    event_type: "execution_completed",
    event_data: {
      protocolId: parsed.data.protocolId,
      kind: parsed.data.kind,
      durationSeconds: parsed.data.durationSeconds,
      details,
    } as Json,
  });

  if (parsed.data.kind === "strength") {
    await insertWorkout({
      user_id: user.id,
      date: new Date().toISOString().slice(0, 10),
      type: "strength",
      duration_minutes: Math.max(1, Math.round(parsed.data.durationSeconds / 60)),
      notes: `Year Mission protocol: ${parsed.data.protocolId}`,
      metadata: details,
    });
  }

  if (parsed.data.taskId) {
    await taskService.complete(user.id, parsed.data.taskId);
  }

  revalidatePath("/");
  revalidatePath("/progress");
  revalidatePath("/tasks");
  return { ok: true } as const;
}

export async function getRecentExecutionAction(protocolId: string) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." } as const;
  const events = await listTaskEvents(user.id, undefined, 100);
  const match = events.find((event) => {
    if (event.event_type !== "execution_completed") return false;
    const data = asObject(event.event_data);
    return data.protocolId === protocolId;
  });
  return { ok: true, data: match ?? null } as const;
}
