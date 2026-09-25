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

function refresh() {
  revalidatePath("/progress");
}

export async function getCreditScoreProgressAction() {
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return { ok: false as const, error: "Not signed in." };

  const { data: latestRows, error: latestError } = await supabase
    .from("credit_score_snapshots")
    .select("id,score,bureau,score_model,source,measured_at,created_at")
    .eq("user_id", user.id)
    .order("measured_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);

  if (latestError) return { ok: false as const, error: latestError.message };

  const latest = latestRows?.[0] ?? null;
  if (!latest) {
    return {
      ok: true as const,
      data: { snapshots: [], latest: null, previous: null, delta: null, best: null },
    };
  }

  const { data: comparableRows, error: comparableError } = await supabase
    .from("credit_score_snapshots")
    .select("id,score,bureau,score_model,source,measured_at,created_at")
    .eq("user_id", user.id)
    .eq("bureau", latest.bureau)
    .eq("score_model", latest.score_model)
    .order("measured_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (comparableError) return { ok: false as const, error: comparableError.message };

  const snapshots = comparableRows ?? [];
  const previous = snapshots.find((item) => item.id !== latest.id) ?? null;

  return {
    ok: true as const,
    data: {
      snapshots,
      latest,
      previous,
      delta: previous ? latest.score - previous.score : null,
      best: snapshots.length ? Math.max(...snapshots.map((item) => item.score)) : latest.score,
    },
  };
}

export async function addCreditScoreSnapshotAction(input: unknown) {
  const parsed = scoreInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Enter a valid score, bureau, model, and date." };

  const todayUtc = new Date().toISOString().slice(0, 10);
  if (parsed.data.measuredAt > todayUtc) {
    return { ok: false as const, error: "The measurement date cannot be in the future." };
  }

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
