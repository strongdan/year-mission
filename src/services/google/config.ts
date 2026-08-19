import "server-only";

export class GoogleConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleConfigError";
  }
}

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  encryptionKey: string;
}

export function googleConfig(): GoogleConfig {
  const clientId = process.env.GOOGLE_TASKS_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_TASKS_CLIENT_SECRET ?? "";
  const redirectUri = process.env.GOOGLE_TASKS_REDIRECT_URI ?? "";
  const encryptionKey = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ?? "";
  if (!clientId || !clientSecret || !redirectUri || !encryptionKey) {
    throw new GoogleConfigError(
      "Google Tasks is not configured. Set GOOGLE_TASKS_CLIENT_ID, GOOGLE_TASKS_CLIENT_SECRET, GOOGLE_TASKS_REDIRECT_URI and GOOGLE_TOKEN_ENCRYPTION_KEY."
    );
  }
  return { clientId, clientSecret, redirectUri, encryptionKey };
}

export function isGoogleTasksConfigured(): boolean {
  return !!(process.env.GOOGLE_TASKS_CLIENT_ID && process.env.GOOGLE_TASKS_CLIENT_SECRET && process.env.GOOGLE_TASKS_REDIRECT_URI && process.env.GOOGLE_TOKEN_ENCRYPTION_KEY);
}