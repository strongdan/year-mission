import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authenticateExternalOwner } from "@/lib/external-owner-auth";
import { syncHealthKitForUser } from "@/services/health-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await authenticateExternalOwner(request, "healthkit");
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    const payload = await request.json();
    const result = await syncHealthKitForUser(auth.admin, auth.userId, payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid HealthKit payload.", issues: error.issues }, { status: 400 });
    }
    console.error("HealthKit sync failed", error);
    return NextResponse.json({ error: "HealthKit sync failed." }, { status: 500 });
  }
}
