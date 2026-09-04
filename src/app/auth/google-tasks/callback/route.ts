import { createAdminClient } from "@/integrations/supabase/server";
import { upsertGoogleConnectionForUser } from "@/services/google/connection-store";
import { encryptToken } from "@/services/google/encryption";
import { exchangeCode, getTokenInfo } from "@/services/google/oauth";
import { verifyGoogleOAuthState } from "@/services/google/oauth-state";
import { googleReconnectMessage, isGoogleReconnectRequired } from "@/services/google/token-errors";
import { NextResponse } from "next/server";

function redirectToSettings(request: Request, params: Record<string, string>) {
  const url = new URL("/settings", request.url);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return NextResponse.redirect(url);
}

function safeErrorMessage(error: unknown): string {
  const value = error instanceof Error ? error.message : "Google connection failed.";
  return value.replace(/[^\w .,:;!?@/\-{}\[\]\"]/g, "").slice(0, 220);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");
  const state = verifyGoogleOAuthState(url.searchParams.get("state"));

  if (oauthError) {
    return redirectToSettings(request, {
      google: "error",
      message: oauthError === "access_denied" ? "Google connection was cancelled." : "Google authorization failed.",
    });
  }

  if (!state) {
    return redirectToSettings(request, {
      google: "error",
      message: "Google authorization expired or could not be verified. Try Connect Google again.",
    });
  }

  if (!code) {
    return redirectToSettings(request, { google: "error", message: "Google returned no authorization code." });
  }

  try {
    const token = await exchangeCode(code);
    if (!token.refreshToken) {
      return redirectToSettings(request, {
        google: "error",
        message: "Google did not return offline access. Reconnect and approve access when prompted.",
      });
    }

    const info = await getTokenInfo(token.accessToken);
    const admin = await createAdminClient();
    if (!admin) throw new Error("Server database access is not configured.");

    const { data: userRecord, error: userError } = await admin.auth.admin.getUserById(state.userId);
    if (userError || !userRecord.user) throw new Error("The Year Mission account that started this connection no longer exists.");

    await upsertGoogleConnectionForUser(state.userId, {
      refresh_token: encryptToken(token.refreshToken),
      token_encrypted: true,
      email: info.email,
      google_user_id: info.userId,
      scope: token.scope,
    });
  } catch (error) {
    return redirectToSettings(request, {
      google: "error",
      message: isGoogleReconnectRequired(error) ? googleReconnectMessage() : safeErrorMessage(error),
    });
  }

  return redirectToSettings(request, { google: "connected" });
}
