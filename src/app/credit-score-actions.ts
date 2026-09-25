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

  const { data, error } = await supabase
    .from("credit_score_snapshots")
    .select("id,score,bureau,score_model,source,measured_at,created_at")
    .eq("user_id", user.id)
    .order("measured_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) return { ok: false as const, error: error.message };

  const snapshots = data ?? [];
  const latest = snapshots[0] ?? null;
  const comparable = latest
    ? snapshots.filter((item) => item.bureau === latest.bureau && item.score_model === latest.score_model)
    : [];
  const previous = latest ? comparable.find((item) => item.id !== latest.id) ?? null : null;

  return {
    ok: true as const,
    data: {
      snapshots,
      latest,
      previous,
      delta: latest && previous ? latest.score - previous.score : null,
      best: comparable.length ? Math.max(...comparable.map((item) => item.score)) : null,
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
