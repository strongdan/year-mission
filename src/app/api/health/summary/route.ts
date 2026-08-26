import { NextResponse } from "next/server";
import { createAdminClient, createServerClientForApp } from "@/integrations/supabase/server";
import { getHealthSummaryForUser } from "@/services/health-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createServerClientForApp();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const admin = await createAdminClient();
  if (!admin) return NextResponse.json({ error: "Supabase admin access is not configured." }, { status: 503 });

  try {
    const summary = await getHealthSummaryForUser(admin, data.user.id);
    return NextResponse.json(summary);
  } catch (summaryError) {
    console.error("Health summary failed", summaryError);
    return NextResponse.json({ error: "Health summary failed." }, { status: 500 });
  }
}
