import "server-only";

import { cookies } from "next/headers";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const SIMPLEFIN_COOKIE = "ym_finance_simplefin";

function encryptionKey(): Buffer {
  const encoded = process.env.INTEGRATION_SECRETS_KEY ?? process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ?? "";
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new Error("Finance secret storage is not configured. Set INTEGRATION_SECRETS_KEY (32 bytes, base64) or GOOGLE_TOKEN_ENCRYPTION_KEY.");
  }
  return key;
}

export function encryptFinanceSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptFinanceSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Malformed encrypted finance secret.");
  const decipher = createDecipheriv(ALGO, encryptionKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}

export async function setSimpleFinAccessUrl(accessUrl: string): Promise<void> {
  const url = new URL(accessUrl);
  if (url.protocol !== "https:") throw new Error("SimpleFIN access URL must use HTTPS.");
  const jar = await cookies();
  jar.set(SIMPLEFIN_COOKIE, encryptFinanceSecret(accessUrl), cookieOptions());
}

export async function getSimpleFinAccessUrl(): Promise<string | null> {
  const jar = await cookies();
  const encrypted = jar.get(SIMPLEFIN_COOKIE)?.value;
  if (!encrypted) return null;
  try {
    return decryptFinanceSecret(encrypted);
  } catch {
    return null;
  }
}

export async function clearSimpleFinAccessUrl(): Promise<void> {
  const jar = await cookies();
  jar.delete(SIMPLEFIN_COOKIE);
}

export async function getSimpleFinConnectionStatus(): Promise<{ configured: boolean }> {
  encryptionKey();
  return { configured: Boolean(await getSimpleFinAccessUrl()) };
}
