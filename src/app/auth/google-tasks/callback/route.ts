import { requireUser } from "@/lib/auth";
import { exchangeCode, getTokenInfo } from "@/services/google/oauth";
import { storeGoogleConnection } from "@/services/google/sync-service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const fail = () => NextResponse.redirect(new URL("/tasks?error=google_callback", base));

  const { user } = await requireUser();
  if (!user || !state || state !== user.id) return fail();
  if (!code) return fail();

  try {
    const token = await exchangeCode(code);
    if (!token.refreshToken) return NextResponse.redirect(new URL("/tasks?error=google_no_refresh", base));
    const info = await getTokenInfo(token.accessToken);
    await storeGoogleConnection(user.id, {
      refreshToken: token.refreshToken,
      email: info.email,
      googleUserId: info.userId,
      scope: token.scope,
    });
  } catch {
    return NextResponse.redirect(new URL("/tasks?error=google_callback", base));
  }

  return NextResponse.redirect(new URL("/tasks?sync=connected", base));
}
