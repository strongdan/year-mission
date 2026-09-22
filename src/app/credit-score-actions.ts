"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

const scoreInput = z.object({
  score: z.coerce.number().int().min(300).max(850),
  bureau: z.string().trim().min(2).max(80),
  scoreModel: z.string().trim().min(2).max(120),
  measuredAt: z.string().date(),
});

const automationInput = z.object({
  externalSubjectId: z.string().trim().min(1).max(240),
  enabled: z.boolean(),
});

function refresh() {
  revalidatePath("/progress");
  revalidatePath("/money");
}

export async function getCreditScoreProgressAction() {
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return { ok: false as const, error: "Not signed in." };

  const [snapshotsResult, connectionResult] = await Promise.all([
    supabase
      .from("credit_score_snapshots")
      .select("id,score,bureau,score_model,source,factors,measured_at,created_at")
      .eq("user_id", user.id)
      .order("measured_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(24),
    supabase
      .from("credit_score_connections")
      .select("provider,external_subject_id,enabled,last_synced_at,last_error")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (snapshotsResult.error) return { ok: false as const, error: snapshotsResult.error.message };
  if (connectionResult.error) return { ok: false as const, error: connectionResult.error.message };

  const snapshots = snapshotsResult.data ?? [];
  const latest = snapshots[0] ?? null;
  const previous = latest
    ? snapshots.find((item) => item.bureau === latest.bureau && item.score_model === latest.score_model && item.id !== latest.id) ?? null
    : null;
  const comparable = latest
    ? snapshots.filter((item) => item.bureau === latest.bureau && item.score_model === latest.score_model)
    : [];

  return {
    ok: true as const,
    data: {
      snapshots,
      latest,
      previous,
      delta: latest && previous ? latest.score - previous.score : null,
      best: comparable.length ? Math.max(...comparable.map((item) => item.score)) : null,
      connection: connectionResult.data ?? null,
      apiConfigured: Boolean(process.env.CREDIT_SCORE_API_URL && process.env.CREDIT_SCORE_API_TOKEN),
    },
  };
}

export async function addCreditScoreSnapshotAction(input: unknown) {
  const parsed = scoreInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Enter a valid score, bureau, model, and date." };
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return { ok: false as const, error: "Not signed in." };

  const { error } = await supabase.from("credit_score_snapshots").upsert(
    {
      user_id: user.id,
      score: parsed.data.score,
      bureau: parsed.data.bureau,
      score_model: parsed.data.scoreModel,
      measured_at: parsed.data.measuredAt,
      source: "manual",
      factors: [],
    },
    { onConflict: "user_id,bureau,score_model,measured_at,source" }
  );
  if (error) return { ok: false as const, error: error.message };
  refresh();
  return { ok: true as const };
}

export async function setCreditScoreAutomationAction(input: unknown) {
  const parsed = automationInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid automatic-sync settings." };
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return { ok: false as const, error: "Not signed in." };

  const { error } = await supabase.from("credit_score_connections").upsert(
    {
      user_id: user.id,
      provider: "generic_api",
      external_subject_id: parsed.data.externalSubjectId,
      enabled: parsed.data.enabled,
      updated_at: new Date().toISOString(),
      last_error: null,
    },
    { onConflict: "user_id" }
  );
  if (error) return { ok: false as const, error: error.message };
  refresh();
  return { ok: true as const };
}
