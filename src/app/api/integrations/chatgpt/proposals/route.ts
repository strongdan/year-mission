import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authenticateExternalOwner } from "@/lib/external-owner-auth";
import { createYearMissionExternalProposal } from "@/services/external-integration-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await authenticateExternalOwner(request, "chatgpt");
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    const proposal = await createYearMissionExternalProposal(auth.admin, auth.userId, await request.json());
    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid proposal.", issues: error.issues }, { status: 400 });
    }
    console.error("ChatGPT proposal failed", error);
    return NextResponse.json({ error: "Unable to record proposal." }, { status: 500 });
  }
}
