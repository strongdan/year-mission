"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { escapeIlikeLiteral, localDateInTimeZone } from "@/domain/credit-score";

const scoreInput = z.object({
  score: z.coerce.number().int().min(300).max(850),
  bureau: z.string().trim().min(2).max(80),
  scoreModel: z.string().trim().min(2).max(120),
  measuredAt: z.string().date(),
  timeZone: z.string().trim().min(1).max(120),
});

function refresh() {
  revalidatePath("/progress");
}


function cleanIdentifier(value: string): string {
  return value.trim().replace(/\s+/g, " ");
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
    .ilike("bureau", escapeIlikeLiteral(latest.bureau))
    .ilike("score_model", escapeIlikeLiteral(latest.score_model))
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

  const localToday = localDateInTimeZone(parsed.data.timeZone);
  if (!localToday) return { ok: false as const, error: "Check the device time zone." };
  if (parsed.data.measuredAt > localToday) {
    return { ok: false as const, error: "The measurement date cannot be in the future." };
  }

  const { user, supabase } = await requireUser();
  if (!user || !supabase) return { ok: false as const, error: "Not signed in." };

  const bureau = cleanIdentifier(parsed.data.bureau);
  const scoreModel = cleanIdentifier(parsed.data.scoreModel);
  const { data: existing, error: existingError } = await supabase
    .from("credit_score_snapshots")
    .select("id")
    .eq("user_id", user.id)
    .eq("measured_at", parsed.data.measuredAt)
    .eq("source", "manual")
    .ilike("bureau", escapeIlikeLiteral(bureau))
    .ilike("score_model", escapeIlikeLiteral(scoreModel))
    .limit(1)
    .maybeSingle();

  if (existingError) return { ok: false as const, error: existingError.message };

  const mutation = existing?.id
    ? supabase.from("credit_score_snapshots").update({
        score: parsed.data.score,
        bureau,
        score_model: scoreModel,
        factors: [],
      }).eq("id", existing.id).eq("user_id", user.id)
    : supabase.from("credit_score_snapshots").insert({
        user_id: user.id,
        score: parsed.data.score,
        bureau,
        score_model: scoreModel,
        measured_at: parsed.data.measuredAt,
        source: "manual",
        factors: [],
      });

  const { error } = await mutation;
  if (error) return { ok: false as const, error: error.message };
  refresh();
  return { ok: true as const };
}
