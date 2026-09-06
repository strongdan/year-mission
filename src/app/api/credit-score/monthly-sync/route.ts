import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/integrations/supabase/server";

const payloadSchema = z.object({
  score: z.number().int().min(300).max(850),
  bureau: z.string().min(2).max(80),
  model: z.string().min(2).max(120),
  measuredAt: z.string().date(),
  factors: z.array(z.string().max(240)).max(12).optional().default([]),
});

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CREDIT_SCORE_CRON_SECRET;
  const apiUrl = process.env.CREDIT_SCORE_API_URL;
  const apiToken = process.env.CREDIT_SCORE_API_TOKEN;
  const auth = request.headers.get("authorization");

  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!apiUrl || !apiToken) {
    return NextResponse.json({ error: "Credit score API is not configured." }, { status: 503 });
  }

  const admin = await createAdminClient();
  if (!admin) return NextResponse.json({ error: "Supabase admin client unavailable." }, { status: 503 });

  const { data: connections, error } = await admin
    .from("credit_score_connections")
    .select("user_id,external_subject_id")
    .eq("enabled", true)
    .eq("provider", "generic_api");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let synced = 0;
  const failures: Array<{ userId: string; error: string }> = [];

  for (const connection of connections ?? []) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ subjectId: connection.external_subject_id }),
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`Provider returned ${response.status}`);
      const parsed = payloadSchema.parse(await response.json());

      const { error: snapshotError } = await admin.from("credit_score_snapshots").upsert(
        {
          user_id: connection.user_id,
          score: parsed.score,
          bureau: parsed.bureau,
          score_model: parsed.model,
          measured_at: parsed.measuredAt,
          factors: parsed.factors,
          source: "api",
        },
        { onConflict: "user_id,bureau,score_model,measured_at,source" }
      );
      if (snapshotError) throw snapshotError;

      await admin
        .from("credit_score_connections")
        .update({ last_synced_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() })
        .eq("user_id", connection.user_id);
      synced += 1;
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message.slice(0, 300) : "Unknown sync error";
      failures.push({ userId: connection.user_id, error: message });
      await admin
        .from("credit_score_connections")
        .update({ last_error: message, updated_at: new Date().toISOString() })
        .eq("user_id", connection.user_id);
    }
  }

  return NextResponse.json({ synced, failed: failures.length, failures });
}
