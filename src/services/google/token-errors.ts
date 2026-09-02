export class GoogleOAuthError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly description: string | null;

  constructor(status: number, code: string | null, description: string | null) {
    const suffix = [code, description].filter(Boolean).join(": ");
    super(`Google token exchange failed (${status})${suffix ? `: ${suffix}` : "."}`);
    this.name = "GoogleOAuthError";
    this.status = status;
    this.code = code;
    this.description = description;
  }
}

export function isGoogleReconnectRequired(error: unknown): boolean {
  if (error instanceof GoogleOAuthError && error.code === "invalid_grant") return true;

  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();

  return (
    normalized.includes("invalid_grant") ||
    normalized.includes("token has been expired or revoked") ||
    normalized.includes("token has been revoked") ||
    normalized.includes("connection expired")
  );
}

export function googleReconnectMessage(): string {
  return "Google authorization expired or was revoked. Reconnect Google to resume Tasks and Calendar sync.";
}
