import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { googleConfig } from "./config";

const MAX_AGE_MS = 15 * 60 * 1000;
const ALLOWED_RETURN_PATHS = new Set(["/settings", "/tasks"]);

interface GoogleOAuthStatePayload {
  userId: string;
  issuedAt: number;
  returnTo: string;
}

function signingKey(): Buffer {
  const { encryptionKey } = googleConfig();
  const key = Buffer.from(encryptionKey, "base64");
  if (key.length !== 32) {
    throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must be 32 bytes encoded as base64.");
  }
  return key;
}

function signature(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

export function createGoogleOAuthState(userId: string, returnTo = "/settings"): string {
  const safeReturnTo = ALLOWED_RETURN_PATHS.has(returnTo) ? returnTo : "/settings";
  const payload: GoogleOAuthStatePayload = {
    userId,
    issuedAt: Date.now(),
    returnTo: safeReturnTo,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function verifyGoogleOAuthState(value: string | null): GoogleOAuthStatePayload | null {
  if (!value) return null;
  const [encoded, suppliedSignature] = value.split(".");
  if (!encoded || !suppliedSignature) return null;

  const expectedSignature = signature(encoded);
  const expected = Buffer.from(expectedSignature);
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<GoogleOAuthStatePayload>;
    if (!payload.userId || typeof payload.userId !== "string") return null;
    if (!payload.issuedAt || typeof payload.issuedAt !== "number") return null;
    if (Date.now() - payload.issuedAt > MAX_AGE_MS || payload.issuedAt > Date.now() + 60_000) return null;
    if (!payload.returnTo || !ALLOWED_RETURN_PATHS.has(payload.returnTo)) return null;
    return payload as GoogleOAuthStatePayload;
  } catch {
    return null;
  }
}
