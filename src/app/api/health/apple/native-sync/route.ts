import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/integrations/supabase/server";
import { verifyNativeCaptureTicket } from "@/services/ideas/native-capture-ticket";
import { upsertHealthSummaries } from "@/services/health/upsert-health-summaries";

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

  const supabaseServer = await createAdminClient();
  if (!supabaseServer) return NextResponse.json({ ok: false, error: "Health sync is not configured." }, { status: 503 });
  try {
    await upsertHealthSummaries(supabaseServer, userId, body.summaries);
  } catch (error) {
    console.error("Native Apple Health summary upsert failed", error);
    return NextResponse.json({ ok: false, error: "Health data could not be saved." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, saved: body.summaries.length });
}
