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

function appUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export function googleRedirectUri(): string {
  return process.env.GOOGLE_TASKS_REDIRECT_URI?.trim() || `${appUrl()}/auth/google-tasks/callback`;
}

export function googleConfig(): GoogleConfig {
  const clientId = process.env.GOOGLE_TASKS_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_TASKS_CLIENT_SECRET ?? "";
  const redirectUri = googleRedirectUri();
  const encryptionKey = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ?? "";
  if (!clientId || !clientSecret || !encryptionKey) {
    throw new GoogleConfigError(
      "Google services are not configured. Set GOOGLE_TASKS_CLIENT_ID, GOOGLE_TASKS_CLIENT_SECRET and GOOGLE_TOKEN_ENCRYPTION_KEY. The callback URL is derived from NEXT_PUBLIC_APP_URL unless GOOGLE_TASKS_REDIRECT_URI overrides it."
    );
  }
  return { clientId, clientSecret, redirectUri, encryptionKey };
}

export function isGoogleTasksConfigured(): boolean {
  return !!(process.env.GOOGLE_TASKS_CLIENT_ID && process.env.GOOGLE_TASKS_CLIENT_SECRET && process.env.GOOGLE_TOKEN_ENCRYPTION_KEY);
}
