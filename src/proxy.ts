import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClientForMiddleware } from "@/integrations/supabase/server";
import { hasSupabaseConfig } from "@/lib/env";

const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!hasSupabaseConfig) {
    return NextResponse.next();
  }

  const created = createServerClientForMiddleware(request);
  if (!created) return NextResponse.next();
  const { client, response } = created;

  const {
    data: { user },
  } = await client.auth.getUser();

  const sessionResponse = response.headers.get("Set-Cookie")
    ? new NextResponse(null, { headers: response.headers })
    : null;

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return sessionResponse ?? NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|sw.js).*)"],
};