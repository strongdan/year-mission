import { requireUser } from "@/lib/auth";
import { connectGoogleTasksUrl } from "@/services/google/sync-service";
import { googleAppUrl } from "@/services/google/config";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const { user } = await requireUser();
  if (!user) return NextResponse.redirect(new URL("/login", requestOrigin));
  const result = await connectGoogleTasksUrl(user.id);
  if ("error" in result) {
    return NextResponse.redirect(new URL("/tasks?error=google_not_configured", googleAppUrl()));
  }
  return NextResponse.redirect(result.url);
}
