import "server-only";
import { googleConfig, GoogleConfigError } from "./config";
import { createGoogleOAuthState } from "./oauth-state";
import { GoogleOAuthError } from "./token-errors";
import { GOOGLE_SCOPES } from "@/domain/google-sync";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export interface TokenResult {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
  scope: string;
}

export function buildAuthUrl(userId: string): string {
  const { clientId, redirectUri } = googleConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: createGoogleOAuthState(userId, "/settings"),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function sanitizeOAuthDetail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const sanitized = value.replace(/[^\w .,:;!?@/\-{}\[\]'\"]/g, "").trim().slice(0, 180);
  return sanitized || null;
}

async function tokenRequest(form: URLSearchParams): Promise<TokenResult> {
  const { clientId, clientSecret } = googleConfig();
  form.set("client_id", clientId);
  form.set("client_secret", clientSecret);
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    let code: string | null = null;
    let description: string | null = null;

    try {
      const parsed = JSON.parse(raw) as { error?: unknown; error_description?: unknown };
      code = sanitizeOAuthDetail(parsed.error);
      description = sanitizeOAuthDetail(parsed.error_description);
    } catch {
      description = sanitizeOAuthDetail(raw);
    }

    throw new GoogleOAuthError(res.status, code, description);
  }
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
  if (!data.access_token) {
    throw new GoogleConfigError("Google returned no access token.");
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresIn: data.expires_in ?? 3600,
    scope: data.scope ?? "",
  };
}

export async function exchangeCode(code: string): Promise<TokenResult> {
  const { redirectUri } = googleConfig();
  return tokenRequest(
    new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    })
  );
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const result = await tokenRequest(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    })
  );
  return result.accessToken;
}

export interface TokenInfo {
  email: string;
  userId: string;
}

export async function getTokenInfo(accessToken: string): Promise<TokenInfo> {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
  if (!res.ok) throw new GoogleConfigError("Failed to verify Google token.");
  const data = (await res.json()) as { email?: string; sub?: string };
  return { email: data.email ?? "", userId: data.sub ?? "" };
}
