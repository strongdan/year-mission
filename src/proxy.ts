import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClientForMiddleware } from "@/integrations/supabase/server";
import { hasSupabaseConfig } from "@/lib/env";

const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/google-tasks/callback", "/native-callback", "/api/notifications/cron"];
const AASA_PATH = "/.well-known/apple-app-site-association";

function applySupabaseResponse(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });

  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = source.headers.get(header);
    if (value) target.headers.set(header, value);
  }

  return target;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apple fetches this association document without an app session. Keep the
  // exact endpoint outside auth/session handling, including for authenticated
  // requests, so it can never be replaced by a redirect or app shell.
  if (pathname === AASA_PATH) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAuthCallback = pathname.startsWith("/auth/callback");
  const isGoogleServiceCallback = pathname.startsWith("/auth/google-tasks/callback");
  const isNativeCallback = pathname.startsWith("/native-callback");
  const isCallback = isAuthCallback || isGoogleServiceCallback || isNativeCallback;

  if (!hasSupabaseConfig) {
    return NextResponse.next();
  }

  const created = createServerClientForMiddleware(request);
  if (!created) return NextResponse.next();
  const { client } = created;

  const { data, error } = await client.auth.getClaims();
  const isAuthenticated = !error && Boolean(data?.claims?.sub);
  const sessionResponse = created.response;

  if (!isAuthenticated && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return applySupabaseResponse(NextResponse.redirect(url), sessionResponse);
  }

  if (isAuthenticated && isPublic && !isCallback) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return applySupabaseResponse(NextResponse.redirect(url), sessionResponse);
  }

  return sessionResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|serwist|sw\\.js).*)"],
};
