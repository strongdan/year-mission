"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createServerClientForApp } from "@/integrations/supabase/server";
import { getProfile } from "@/repositories/supabase-repository";
import {
  applyMonthChoice,
  currentConfidenceRep,
  getConversationMonth,
  mondayConversationPlan,
  summarizeConfidenceEvidence,
} from "@/domain/conversation-confidence";
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
const CHALLENGE_Z = z.enum(["normal", "tiny"]);
const EVIDENCE_Z = z.object({
  month: z.number().int().min(1).max(12),
  repIndex: z.number().int().nonnegative(),
  outcome: z.enum(["nothing-bad", "awkward-handled", "disapproval-handled", "noticed-avoidance"]),
  lesson: z.string().trim().max(240).optional().default(""),
});
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

async function updatePath(change: (current: StoredPath) => StoredPath | null) {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." } as const;
  const profile = await getProfile(user.id);
  const preferences = objectValue(profile?.preferences);
  const supabase = await createServerClientForApp();
  if (!supabase) return { ok: false, error: "Database is not configured." } as const;
  const next = change(parseStoredConversationPath(preferences));
  if (!next) return { ok: false, error: "The rep changed. Refresh Today before recording another outcome." } as const;

  const revision = objectValue(preferences.conversationConfidence).revision;
  const revisionField = "preferences->conversationConfidence->>revision";
  const write = supabase.from("profiles").update({
    preferences: { ...preferences, conversationConfidence: { ...next, revision: crypto.randomUUID() } },
  }).eq("id", user.id);
  const guarded = revision == null ? write.is(revisionField, null) : write.eq(revisionField, String(revision));
  const { data, error } = await guarded.select("id").maybeSingle();
  if (error) return { ok: false, error: error.message } as const;
  if (!data) return { ok: false, error: "Your confidence focus changed. Refresh Today and try again." } as const;
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
      rep: currentConfidenceRep({
        month: path.month,
        repIndex: path.repIndex,
        challengeLevel: path.challengeLevel,
      }),
      summary: summarizeConfidenceEvidence(path.evidence),
      resources: resourcesForMonth(path.month).slice(0, 2),
    },
  } as const;
}

export async function saveConversationConfidenceAction(input: unknown) {
  const parsed = PATH_Z.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Confidence focus details are invalid." } as const;
  return updatePath((current) => ({ ...current, ...parsed.data }));
}

export async function chooseConversationMonthAction(input: unknown) {
  const choice = CHOICE_Z.safeParse(input);
  if (!choice.success) return { ok: false, error: "Month choice is invalid." } as const;
  return updatePath((current) => ({
    ...current,
    ...applyMonthChoice(current.month, choice.data),
    active: true,
    challengeLevel: "normal",
  }));
}

export async function advanceConfidenceRepAction() {
  return updatePath((current) => ({
    ...current,
    repIndex: current.repIndex + 1,
    challengeLevel: "normal",
  }));
}

export async function setConfidenceChallengeLevelAction(input: unknown) {
  const parsed = CHALLENGE_Z.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Challenge level is invalid." } as const;
  return updatePath((current) => ({ ...current, challengeLevel: parsed.data }));
}

export async function recordConfidenceEvidenceAction(input: unknown) {
  const parsed = EVIDENCE_Z.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Confidence evidence is invalid." } as const;
  return updatePath((current) => {
    if (current.month !== parsed.data.month || current.repIndex !== parsed.data.repIndex) return null;
    const rep = currentConfidenceRep(current);
    const entry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      repId: rep.id,
      category: rep.category,
      outcome: parsed.data.outcome,
      ...(parsed.data.lesson ? { lesson: parsed.data.lesson } : {}),
    };
    return {
      ...current,
      evidence: [...current.evidence, entry].slice(-100),
      repIndex: current.repIndex + 1,
      challengeLevel: "normal",
    };
  });
}

export async function renameConversationFocusAction(title: unknown) {
  const parsed = z.string().trim().min(1).max(120).safeParse(title);
  if (!parsed.success) return { ok: false, error: "Focus title must be between 1 and 120 characters." } as const;
  return updatePath((current) => ({
    ...current, title: parsed.data, active: true, status: current.status === "stopped" ? "active" : current.status,
  }));
}

export async function stopConversationFocusAction() {
  return updatePath((current) => ({ ...current, active: false, status: "stopped" }));
}

export async function saveConversationReflectionAction(input: unknown) {
  const parsed = REFLECTION_Z.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Reflection is invalid." } as const;
  return updatePath((current) => ({
    ...current,
    reflections: { ...current.reflections, [parsed.data.month]: parsed.data },
  }));
}
