import { NextResponse } from "next/server";
import { authenticateExternalOwner } from "@/lib/external-owner-auth";
import { getYearMissionExternalContext } from "@/services/external-integration-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authenticateExternalOwner(request, "chatgpt");
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    return NextResponse.json(await getYearMissionExternalContext(auth.admin, auth.userId));
  } catch (error) {
    console.error("ChatGPT context read failed", error);
    return NextResponse.json({ error: "Unable to load Year Mission context." }, { status: 500 });
  }
}
