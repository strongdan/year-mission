import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabaseServer";

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
  summaries: z.array(summarySchema).min(1).max(31),
});

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid health summary payload." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const supabaseServer = await getSupabaseServer();
  if (!supabaseServer) return NextResponse.json({ error: "Health sync is not configured." }, { status: 503 });

  const dates = parsed.summaries.map((summary) => summary.date);
  const { data: existingRows, error: existingError } = await supabaseServer
    .from("health_daily_summaries")
    .select("date,steps,active_energy_kcal,exercise_minutes,stand_hours,hrv_sdnn_ms,resting_heart_rate_bpm,sleep_minutes")
    .eq("user_id", authData.user.id)
    .eq("source", "apple_health")
    .in("date", dates);

  if (existingError) {
    console.error("Apple Health summary read-before-upsert failed", existingError);
    return NextResponse.json({ error: "Health data could not be read safely." }, { status: 500 });
  }

  const existingByDate = new Map((existingRows ?? []).map((row) => [row.date, row]));
  const rows = parsed.summaries.map((summary) => {
    const existing = existingByDate.get(summary.date);
    return {
      user_id: authData.user.id,
      date: summary.date,
      steps: summary.steps ?? existing?.steps ?? null,
      active_energy_kcal: summary.activeEnergyKcal ?? existing?.active_energy_kcal ?? null,
      exercise_minutes: summary.exerciseMinutes ?? existing?.exercise_minutes ?? null,
      stand_hours: summary.standHours ?? existing?.stand_hours ?? null,
      hrv_sdnn_ms: summary.hrvSdnnMs ?? existing?.hrv_sdnn_ms ?? null,
      resting_heart_rate_bpm: summary.restingHeartRateBpm ?? existing?.resting_heart_rate_bpm ?? null,
      sleep_minutes: summary.sleepMinutes ?? existing?.sleep_minutes ?? null,
      observed_at: summary.observedAt ?? now,
      source: "apple_health",
      updated_at: now,
    };
  });

  const { error } = await supabaseServer
    .from("health_daily_summaries")
    .upsert(rows, { onConflict: "user_id,date,source" });

  if (error) {
    console.error("Apple Health summary upsert failed", error);
    return NextResponse.json({ error: "Health data could not be saved." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, saved: rows.length });
}
