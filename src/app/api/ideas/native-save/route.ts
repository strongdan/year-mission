import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/integrations/supabase/server";
import { verifyNativeCaptureTicket } from "@/services/ideas/native-capture-ticket";

export const runtime = "nodejs";

const bodySchema = z.object({
  captureId: z.string().uuid(),
  originalText: z.string().trim().min(1).max(20_000),
});

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

function titleFromDump(value: string): string {
  const first = value.split(/\n|(?<=[.!?])\s+/)[0]?.trim() || "Untitled thought";
  return first.length > 90 ? `${first.slice(0, 87).trimEnd()}…` : first;
}

export async function POST(request: Request) {
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ ok: false, error: "Missing native capture ticket." }, { status: 401 });

  try {
    const ticket = verifyNativeCaptureTicket(token);
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Narration text is missing or invalid." }, { status: 400 });
    }

    const admin = await createAdminClient();
    if (!admin) return NextResponse.json({ ok: false, error: "Database admin access is not configured." }, { status: 503 });

    const row = {
      id: parsed.data.captureId,
      user_id: ticket.uid,
      title: titleFromDump(parsed.data.originalText),
      notes: parsed.data.originalText,
      status: "parked",
    };

    const inserted = await admin.from("ideas").insert(row).select("*").single();
    if (!inserted.error) {
      return NextResponse.json({ ok: true, data: inserted.data });
    }

    if (inserted.error.code === "23505") {
      const existing = await admin
        .from("ideas")
        .select("*")
        .eq("id", parsed.data.captureId)
        .eq("user_id", ticket.uid)
        .maybeSingle();
      if (!existing.error && existing.data) {
        return NextResponse.json({ ok: true, data: existing.data });
      }
    }

    return NextResponse.json({ ok: false, error: "Could not save the narrated thought." }, { status: 500 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the narrated thought.";
    const status = /ticket|expired/i.test(message) ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
