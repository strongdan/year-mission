import { env, aiMockMode } from "@/lib/env";
import type { AiProvider, ModelConfig } from "./provider";
import { GEMINI_MODELS, OPENAI_MODELS } from "./provider";
import { createGeminiProvider } from "./gemini-provider";
import { createOpenAiProvider } from "./openai-provider";
import { createMockProvider } from "./mock-provider";

let cachedProvider: AiProvider | null = null;

function selectedProvider(): "gemini" | "openai" | "mock" {
  if (aiMockMode === "force" || env.AI_PROVIDER === "mock") return "mock";
  if (env.AI_PROVIDER === "gemini") return env.GEMINI_API_KEY ? "gemini" : "mock";
  if (env.AI_PROVIDER === "openai") return env.OPENAI_API_KEY ? "openai" : "mock";
  if (env.GEMINI_API_KEY) return "gemini";
  if (env.OPENAI_API_KEY) return "openai";
  return "mock";
}

export function getModelConfig(): ModelConfig {
  return selectedProvider() === "gemini" ? GEMINI_MODELS : OPENAI_MODELS;
}

export function getAiProvider(): AiProvider {
  if (cachedProvider) return cachedProvider;

  const provider = selectedProvider();
  if (provider === "gemini" && env.GEMINI_API_KEY) {
    cachedProvider = createGeminiProvider({ apiKey: env.GEMINI_API_KEY, modelConfig: GEMINI_MODELS });
  } else if (provider === "openai" && env.OPENAI_API_KEY) {
    cachedProvider = createOpenAiProvider({ apiKey: env.OPENAI_API_KEY, modelConfig: OPENAI_MODELS });
  } else {
    cachedProvider = createMockProvider(getModelConfig());
  }

  return cachedProvider;
}

/**
 * Request-scoped provider selection. A key entered in Settings takes precedence
 * over deployment-wide environment keys. The stored key is only available on
 * the server through an encrypted HttpOnly cookie.
 */
export async function getAiProviderForRequest(): Promise<AiProvider> {
  if (aiMockMode === "force") return createMockProvider(getModelConfig());

  try {
    const { getPreferredAiProvider, getStoredApiKey } = await import("@/services/integrations/api-key-store");
    const preferred = await getPreferredAiProvider();
    const geminiKey = await getStoredApiKey("gemini");
    const openaiKey = await getStoredApiKey("openai");

    if (preferred === "gemini" && geminiKey) {
      return createGeminiProvider({ apiKey: geminiKey, modelConfig: GEMINI_MODELS });
    }
    if (preferred === "openai" && openaiKey) {
      return createOpenAiProvider({ apiKey: openaiKey, modelConfig: OPENAI_MODELS });
    }
    if (geminiKey) return createGeminiProvider({ apiKey: geminiKey, modelConfig: GEMINI_MODELS });
    if (openaiKey) return createOpenAiProvider({ apiKey: openaiKey, modelConfig: OPENAI_MODELS });
  } catch {
    // If per-device secret storage is unavailable, deployment-level AI still works.
  }

  return getAiProvider();
}

export async function getAiConnectionStatus() {
  const provider = await getAiProviderForRequest();
  let stored = {
    preferred: null as "gemini" | "openai" | null,
    gemini: { configured: false, hint: null as string | null },
    openai: { configured: false, hint: null as string | null },
  };
  let storageAvailable = true;

  try {
    const { getStoredApiStatus } = await import("@/services/integrations/api-key-store");
    stored = await getStoredApiStatus();
  } catch {
    storageAvailable = false;
  }

  const model = provider.name === "gemini" ? GEMINI_MODELS.coach : provider.name === "openai" ? OPENAI_MODELS.coach : getModelConfig().coach;
  return {
    provider: provider.name,
    model,
    mock: provider.name === "mock",
    freeTier: provider.name === "gemini",
    storageAvailable,
    stored,
    environment: {
      gemini: Boolean(env.GEMINI_API_KEY),
      openai: Boolean(env.OPENAI_API_KEY),
    },
  };
}

export function createAiProviderFromKey(provider: "gemini" | "openai", apiKey: string): AiProvider {
  return provider === "gemini"
    ? createGeminiProvider({ apiKey, modelConfig: GEMINI_MODELS })
    : createOpenAiProvider({ apiKey, modelConfig: OPENAI_MODELS });
}

export function isMockMode(): boolean {
  return getAiProvider().name === "mock";
}
