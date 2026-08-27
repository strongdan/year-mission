import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { issueNativeCaptureTicket } from "@/services/ideas/native-capture-ticket";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });

  try {
    const { ticket, expiresAt } = issueNativeCaptureTicket(user.id);
    const origin = new URL(request.url).origin;
    const params = new URLSearchParams({ ticket, base: origin });
    return NextResponse.json({
      ok: true,
      data: {
        deepLink: `yearmission://brain-dump?${params.toString()}`,
        expiresAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare native narration.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
