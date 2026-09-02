"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAiProviderFromKey, getAiConnectionStatus } from "@/integrations/ai";
import {
  clearStoredApiKey,
  getStoredApiKey,
  setPreferredAiProvider,
  setStoredApiKey,
  type UserAiProvider,
} from "@/services/integrations/api-key-store";

const PROVIDER_Z = z.enum(["gemini", "openrouter", "groq", "openai"]);
const API_KEY_Z = z.string().trim().min(12).max(512);

export async function getAiStatusAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  return { ok: true as const, data: await getAiConnectionStatus() };
}

export async function saveAiApiKeyAction(input: { provider: UserAiProvider; apiKey: string }) {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };

  const providerParsed = PROVIDER_Z.safeParse(input.provider);
  const keyParsed = API_KEY_Z.safeParse(input.apiKey);
  if (!providerParsed.success || !keyParsed.success) {
    return { ok: false as const, error: "Enter a valid API key." };
  }

  try {
    const provider = createAiProviderFromKey(providerParsed.data, keyParsed.data);
    await provider.complete({
      messages: [{ role: "user", content: "Reply with only the word OK." }],
      modelKind: "cheap",
      maxTokens: 8,
    });
  } catch {
    return { ok: false as const, error: "The provider did not accept that key. Check it and try again." };
  }

  try {
    await setStoredApiKey(providerParsed.data, keyParsed.data);
    await setPreferredAiProvider(providerParsed.data);
    return { ok: true as const, data: await getAiConnectionStatus() };
  } catch {
    return { ok: false as const, error: "Secure API-key storage is not configured on the server." };
  }
}

export async function removeAiApiKeyAction(provider: UserAiProvider) {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  const parsed = PROVIDER_Z.safeParse(provider);
  if (!parsed.success) return { ok: false as const, error: "Unknown provider." };

  await clearStoredApiKey(parsed.data);
  return { ok: true as const, data: await getAiConnectionStatus() };
}

export async function selectAiProviderAction(provider: UserAiProvider) {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  const parsed = PROVIDER_Z.safeParse(provider);
  if (!parsed.success) return { ok: false as const, error: "Unknown provider." };

  const apiKey = await getStoredApiKey(parsed.data);
  if (!apiKey) return { ok: false as const, error: "Add this provider's API key first." };

  await setPreferredAiProvider(parsed.data);
  return { ok: true as const, data: await getAiConnectionStatus() };
}
