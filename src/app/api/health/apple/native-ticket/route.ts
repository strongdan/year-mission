import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { issueNativeCaptureTicket } from "@/services/ideas/native-capture-ticket";

export const runtime = "nodejs";

const PRODUCTION_ORIGIN = "https://year-mission.dangaston.workers.dev";

export async function POST() {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });

  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configuredOrigin !== PRODUCTION_ORIGIN) {
    return NextResponse.json({ ok: false, error: "Native Apple Health sync is available only from the production Year Mission app." }, { status: 503 });
  }

  try {
    const { ticket, expiresAt } = issueNativeCaptureTicket(user.id);
    const params = new URLSearchParams({ ticket });
    return NextResponse.json({
      ok: true,
      data: {
        deepLink: `yearmission://health-sync?${params.toString()}`,
        expiresAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare Apple Health sync.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
