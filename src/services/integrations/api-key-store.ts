import "server-only";

import { cookies } from "next/headers";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type UserAiProvider = "gemini" | "openrouter" | "groq" | "openai";

const ALGO = "aes-256-gcm";
const COOKIE_NAMES: Record<UserAiProvider, string> = {
  gemini: "ym_api_gemini",
  openrouter: "ym_api_openrouter",
  groq: "ym_api_groq",
  openai: "ym_api_openai",
};
const PROVIDER_COOKIE = "ym_ai_provider";
const PROVIDERS: readonly UserAiProvider[] = ["gemini", "openrouter", "groq", "openai"];

function encryptionKey(): Buffer {
  const encoded = process.env.INTEGRATION_SECRETS_KEY ?? process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ?? "";
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new Error("API key storage is not configured. Set INTEGRATION_SECRETS_KEY (32 bytes, base64) or GOOGLE_TOKEN_ENCRYPTION_KEY.");
  }
  return key;
}

function encrypt(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Malformed encrypted API key.");
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

export async function getStoredApiKey(provider: UserAiProvider): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(COOKIE_NAMES[provider])?.value;
  if (!value) return null;
  try {
    return decrypt(value);
  } catch {
    return null;
  }
}

export async function setStoredApiKey(provider: UserAiProvider, apiKey: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAMES[provider], encrypt(apiKey.trim()), cookieOptions());
}

export async function clearStoredApiKey(provider: UserAiProvider): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAMES[provider]);
  const preferred = jar.get(PROVIDER_COOKIE)?.value;
  if (preferred === provider) jar.delete(PROVIDER_COOKIE);
}

export async function getPreferredAiProvider(): Promise<UserAiProvider | null> {
  const jar = await cookies();
  const value = jar.get(PROVIDER_COOKIE)?.value;
  return PROVIDERS.includes(value as UserAiProvider) ? (value as UserAiProvider) : null;
}

export async function setPreferredAiProvider(provider: UserAiProvider): Promise<void> {
  const jar = await cookies();
  jar.set(PROVIDER_COOKIE, provider, cookieOptions());
}

export async function getStoredApiStatus(): Promise<{
  preferred: UserAiProvider | null;
  gemini: { configured: boolean; hint: string | null };
  openrouter: { configured: boolean; hint: string | null };
  groq: { configured: boolean; hint: string | null };
  openai: { configured: boolean; hint: string | null };
}> {
  encryptionKey();

  const [preferred, gemini, openrouter, groq, openai] = await Promise.all([
    getPreferredAiProvider(),
    getStoredApiKey("gemini"),
    getStoredApiKey("openrouter"),
    getStoredApiKey("groq"),
    getStoredApiKey("openai"),
  ]);
  const hint = (value: string | null) => value ? `••••${value.slice(-4)}` : null;
  return {
    preferred,
    gemini: { configured: Boolean(gemini), hint: hint(gemini) },
    openrouter: { configured: Boolean(openrouter), hint: hint(openrouter) },
    groq: { configured: Boolean(groq), hint: hint(groq) },
    openai: { configured: Boolean(openai), hint: hint(openai) },
  };
}
