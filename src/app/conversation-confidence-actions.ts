"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createServerClientForApp } from "@/integrations/supabase/server";
import { getProfile } from "@/repositories/supabase-repository";
import { applyMonthChoice, getConversationMonth, mondayConversationPlan, type MonthChoice } from "@/domain/conversation-confidence";
import { resourcesForMonth } from "@/domain/support-resources";
import { parseStoredConversationPath, type StoredConversationPath } from "@/domain/conversation-confidence-storage";

const PATH_Z = z.object({
  active: z.boolean(),
  title: z.string().trim().min(1).max(120),
  objective: z.string().trim().min(1).max(500),
  month: z.number().int().min(1).max(12),
  status: z.enum(["active", "paused", "stopped"]),
});

const CHOICE_Z = z.enum(["repeat", "next", "skip", "pause"]);
const REFLECTION_Z = z.object({
  month: z.number().int().min(1).max(12),
  willingness: z.number().int().min(1).max(5).nullable().optional(),
  expression: z.number().int().min(1).max(5).nullable().optional(),
  recovery: z.number().int().min(1).max(5).nullable().optional(),
  connection: z.number().int().min(1).max(5).nullable().optional(),
  note: z.string().trim().max(500).optional().default(""),
});

type StoredPath = StoredConversationPath;

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

async function savePath(path: StoredPath) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." } as const;
  const profile = await getProfile(user.id);
  const preferences = objectValue(profile?.preferences);
  const supabase = await createServerClientForApp();
  if (!supabase) return { ok: false, error: "Database is not configured." } as const;
  const { error } = await supabase.from("profiles").update({ preferences: { ...preferences, conversationConfidence: path } }).eq("id", user.id);
  if (error) return { ok: false, error: error.message } as const;
  revalidatePath("/");
  revalidatePath("/progress");
  return { ok: true } as const;
}

export async function getConversationConfidenceAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." } as const;
  const profile = await getProfile(user.id);
  const path = parseStoredConversationPath(profile?.preferences);
  const month = getConversationMonth(path.month)!;
  return {
    ok: true,
    data: {
      path,
      month,
      monday: mondayConversationPlan(path.month),
      resources: resourcesForMonth(path.month).slice(0, 2),
    },
  } as const;
}

export async function saveConversationConfidenceAction(input: unknown) {
  const parsed = PATH_Z.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Conversation focus details are invalid." } as const;
  const current = await getConversationConfidenceAction();
  if (!current.ok) return current;
  return savePath({ ...parsed.data, reflections: current.data.path.reflections ?? {} });
}

export async function chooseConversationMonthAction(input: unknown) {
  const choice = CHOICE_Z.safeParse(input);
  if (!choice.success) return { ok: false, error: "Month choice is invalid." } as const;
  const current = await getConversationConfidenceAction();
  if (!current.ok) return current;
  const next = applyMonthChoice(current.data.path.month, choice.data as MonthChoice);
  return savePath({ ...current.data.path, ...next, active: true });
}

export async function renameConversationFocusAction(title: unknown) {
  const parsed = z.string().trim().min(1).max(120).safeParse(title);
  if (!parsed.success) return { ok: false, error: "Focus title must be between 1 and 120 characters." } as const;
  const current = await getConversationConfidenceAction();
  if (!current.ok) return current;
  return savePath({ ...current.data.path, title: parsed.data, active: true, status: current.data.path.status === "stopped" ? "active" : current.data.path.status });
}

export async function stopConversationFocusAction() {
  const current = await getConversationConfidenceAction();
  if (!current.ok) return current;
  return savePath({ ...current.data.path, active: false, status: "stopped" });
}

export async function saveConversationReflectionAction(input: unknown) {
  const parsed = REFLECTION_Z.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Reflection is invalid." } as const;
  const current = await getConversationConfidenceAction();
  if (!current.ok) return current;
  return savePath({
    ...current.data.path,
    reflections: { ...(current.data.path.reflections ?? {}), [parsed.data.month]: parsed.data },
  });
}
