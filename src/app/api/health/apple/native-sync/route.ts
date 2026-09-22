import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { verifyNativeCaptureTicket } from "@/services/ideas/native-capture-ticket";
import { mergeHealthSummary } from "@/domain/health-sync";

export const runtime = "nodejs";

const summarySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  steps: z.number().int().nonnegative().nullable().optional(),
  activeEnergyKcal: z.number().nonnegative().nullable().optional(),
  exerciseMinutes: z.number().int().nonnegative().nullable().optional(),
  standHours: z.number().int().nonnegative().max(24).nullable().optional(),
  hrvSdnnMs: z.number().positive().nullable().optional(),
  restingHeartRateBpm: z.number().positive().nullable().optional(),
  sleepMinutes: z.number().int().nonnegative().nullable().optional(),
  observedAt: z.string().datetime().optional(),
});

const bodySchema = z.object({
  ticket: z.string().min(20),
  summaries: z.array(summarySchema).min(1).max(31),
});

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid health summary payload." }, { status: 400 });
  }

  let userId: string;
  try {
    userId = verifyNativeCaptureTicket(body.ticket).uid;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid native sync ticket.";
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }

  const supabaseServer = await getSupabaseServer();
  if (!supabaseServer) return NextResponse.json({ ok: false, error: "Health sync is not configured." }, { status: 503 });
  const now = new Date().toISOString();
  const dates = [...new Set(body.summaries.map((summary) => summary.date))];
  const { data: existingRows, error: existingError } = await supabaseServer
    .from("health_daily_summaries")
    .select("date,steps,active_energy_kcal,exercise_minutes,stand_hours,hrv_sdnn_ms,resting_heart_rate_bpm,sleep_minutes,observed_at")
    .eq("user_id", userId)
    .eq("source", "apple_health")
    .in("date", dates);
  if (existingError) return NextResponse.json({ ok: false, error: "Health data could not be read." }, { status: 500 });
  const existingByDate = new Map((existingRows ?? []).map((row) => [String(row.date), row]));
  const rows = body.summaries.map((summary) => ({
    user_id: userId,
    date: summary.date,
    ...mergeHealthSummary(existingByDate.get(summary.date), {
      steps: summary.steps,
      active_energy_kcal: summary.activeEnergyKcal,
      exercise_minutes: summary.exerciseMinutes,
      stand_hours: summary.standHours,
      hrv_sdnn_ms: summary.hrvSdnnMs,
      resting_heart_rate_bpm: summary.restingHeartRateBpm,
      sleep_minutes: summary.sleepMinutes,
      observed_at: summary.observedAt,
    }, now),
    source: "apple_health",
    updated_at: now,
  }));
  const { error } = await supabaseServer
    .from("health_daily_summaries")
    .upsert(rows, { onConflict: "user_id,date,source" });

  if (error) {
    console.error("Native Apple Health summary upsert failed", error);
    return NextResponse.json({ ok: false, error: "Health data could not be saved." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, saved: rows.length });
}
