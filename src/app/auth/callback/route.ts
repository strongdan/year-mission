import { createServerClientForApp } from "@/integrations/supabase/server";
import { NextResponse } from "next/server";

function callbackFailureRedirect(request: Request, message: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", "callback");
  url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}

function authErrorMessage(error: { message?: string } | null | undefined) {
  if (!error?.message) return "Authentication callback did not include a usable session.";
  return error.message.replace(/[^\w .,:;!?@/-]/g, "").slice(0, 240);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createServerClientForApp();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, request.url));
      }
      return callbackFailureRedirect(request, authErrorMessage(error));
    }
    return callbackFailureRedirect(request, "Supabase authentication is not configured.");
  }

  return callbackFailureRedirect(request, "Authentication callback was missing a code.");
}
