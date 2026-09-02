export function isGoogleReconnectRequired(error: unknown): boolean {
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
  return "Google authorization expired. Reconnect Google to resume Tasks and Calendar sync.";
}
