import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseServer";
import { verifyNativeCaptureTicket } from "@/services/ideas/native-capture-ticket";

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

  const now = new Date().toISOString();
  const rows = body.summaries.map((summary) => ({
    user_id: userId,
    date: summary.date,
    steps: summary.steps ?? null,
    active_energy_kcal: summary.activeEnergyKcal ?? null,
    exercise_minutes: summary.exerciseMinutes ?? null,
    stand_hours: summary.standHours ?? null,
    hrv_sdnn_ms: summary.hrvSdnnMs ?? null,
    resting_heart_rate_bpm: summary.restingHeartRateBpm ?? null,
    sleep_minutes: summary.sleepMinutes ?? null,
    observed_at: summary.observedAt ?? now,
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
