import { requireUser } from "@/lib/auth";
import { connectGoogleTasksUrl } from "@/services/google/sync-service";
import { NextResponse } from "next/server";

export async function GET() {
  const { user } = await requireUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  const result = await connectGoogleTasksUrl(user.id);
  if ("error" in result) {
    return NextResponse.redirect(new URL("/tasks?error=google_not_configured", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }
  return NextResponse.redirect(result.url);
}