"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { localDateInTimeZone, sameCreditSeries } from "@/domain/credit-score";

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

  const { data: rows, error: latestError } = await supabase
    .from("credit_score_snapshots")
    .select("id,score,bureau,score_model,source,measured_at,created_at")
    .eq("user_id", user.id)
    .order("measured_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (latestError) return { ok: false as const, error: latestError.message };

  const latest = rows?.[0] ?? null;
  if (!latest) {
    return {
      ok: true as const,
      data: { snapshots: [], latest: null, previous: null, delta: null, best: null },
    };
  }

  const snapshots = (rows ?? []).filter((item) => sameCreditSeries(
    { bureau: item.bureau, scoreModel: item.score_model },
    { bureau: latest.bureau, scoreModel: latest.score_model },
  ));
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
  const { error } = await supabase.rpc("upsert_credit_score_snapshot", {
    p_score: parsed.data.score,
    p_bureau: bureau,
    p_score_model: scoreModel,
    p_measured_at: parsed.data.measuredAt,
    p_source: "manual",
    p_factors: [],
    p_local_today: localToday,
  });
  if (error) return { ok: false as const, error: error.message };
  refresh();
  return { ok: true as const };
}
