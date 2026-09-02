import { env, aiMockMode } from "@/lib/env";
import type { AiProvider, ModelConfig } from "./provider";
import { GEMINI_MODELS, GROQ_MODELS, OPENAI_MODELS, OPENROUTER_MODELS } from "./provider";
import { createFallbackProvider } from "./fallback-provider";
import { createGeminiProvider } from "./gemini-provider";
import { createMockProvider } from "./mock-provider";
import { createOpenAiCompatibleProvider } from "./openai-compatible-provider";
import { createOpenAiProvider } from "./openai-provider";
import type { UserAiProvider } from "@/services/integrations/api-key-store";

let cachedProvider: AiProvider | null = null;

const FREE_FIRST_ORDER: readonly UserAiProvider[] = ["gemini", "openrouter", "groq", "openai"];

function modelConfig(provider: UserAiProvider): ModelConfig {
  if (provider === "gemini") return GEMINI_MODELS;
  if (provider === "openrouter") return OPENROUTER_MODELS;
  if (provider === "groq") return GROQ_MODELS;
  return OPENAI_MODELS;
}

function envKey(provider: UserAiProvider): string | undefined {
  if (provider === "gemini") return env.GEMINI_API_KEY;
  if (provider === "openrouter") return env.OPENROUTER_API_KEY;
  if (provider === "groq") return env.GROQ_API_KEY;
  return env.OPENAI_API_KEY;
}

function createProvider(provider: UserAiProvider, apiKey: string): AiProvider {
  if (provider === "gemini") {
    return createGeminiProvider({ apiKey, modelConfig: GEMINI_MODELS });
  }
  if (provider === "openrouter") {
    return createOpenAiCompatibleProvider({
      name: "openrouter",
      apiKey,
      baseUrl: "https://openrouter.ai/api/v1",
      modelConfig: OPENROUTER_MODELS,
    });
  }
  if (provider === "groq") {
    return createOpenAiCompatibleProvider({
      name: "groq",
      apiKey,
      baseUrl: "https://api.groq.com/openai/v1",
      modelConfig: GROQ_MODELS,
    });
  }
  return createOpenAiProvider({ apiKey, modelConfig: OPENAI_MODELS });
}

function orderedProviderNames(preferred?: UserAiProvider | null): UserAiProvider[] {
  const explicit = env.AI_PROVIDER;
  const first = preferred ?? (explicit !== "auto" && explicit !== "mock" ? explicit : null);
  const names = first ? [first, ...FREE_FIRST_ORDER] : [...FREE_FIRST_ORDER];
  return names.filter((provider, index, all) => all.indexOf(provider) === index);
}

function createEnvironmentProvider(): AiProvider {
  if (aiMockMode === "force" || env.AI_PROVIDER === "mock") return createMockProvider(OPENAI_MODELS);

  const providers = orderedProviderNames()
    .map((provider) => {
      const key = envKey(provider);
      return key ? createProvider(provider, key) : null;
    })
    .filter((provider): provider is AiProvider => provider !== null);

  if (providers.length === 0) return createMockProvider(OPENAI_MODELS);
  return providers.length === 1 ? providers[0] : createFallbackProvider(providers);
}

export function getModelConfig(): ModelConfig {
  const selected = env.AI_PROVIDER;
  if (selected !== "auto" && selected !== "mock") return modelConfig(selected);
  const firstConfigured = FREE_FIRST_ORDER.find((provider) => Boolean(envKey(provider)));
  return firstConfigured ? modelConfig(firstConfigured) : OPENAI_MODELS;
}

export function getAiProvider(): AiProvider {
  if (!cachedProvider) cachedProvider = createEnvironmentProvider();
  return cachedProvider;
}

/**
 * Request-scoped provider selection. A key entered in Settings takes precedence
 * over deployment-wide environment keys. All other configured providers remain
 * eligible as fallbacks, with free-tier paths attempted before paid OpenAI by default.
 */
export async function getAiProviderForRequest(): Promise<AiProvider> {
  if (aiMockMode === "force") return createMockProvider(getModelConfig());

  try {
    const { getPreferredAiProvider, getStoredApiKey } = await import("@/services/integrations/api-key-store");
    const preferred = await getPreferredAiProvider();
    const storedKeys = new Map<UserAiProvider, string>();

    for (const provider of FREE_FIRST_ORDER) {
      const key = await getStoredApiKey(provider);
      if (key) storedKeys.set(provider, key);
    }

    const providers: AiProvider[] = [];
    const added = new Set<string>();
    const push = (provider: UserAiProvider, apiKey: string) => {
      if (added.has(provider)) return;
      providers.push(createProvider(provider, apiKey));
      added.add(provider);
    };

    for (const provider of orderedProviderNames(preferred)) {
      const stored = storedKeys.get(provider);
      if (stored) push(provider, stored);
    }

    for (const provider of orderedProviderNames()) {
      const key = envKey(provider);
      if (key) push(provider, key);
    }

    if (providers.length > 0) {
      return providers.length === 1 ? providers[0] : createFallbackProvider(providers);
    }
  } catch {
    // If per-device secret storage is unavailable, deployment-level AI still works.
  }

  return getAiProvider();
}

export async function getAiConnectionStatus() {
  const provider = await getAiProviderForRequest();
  let stored = {
    preferred: null as UserAiProvider | null,
    gemini: { configured: false, hint: null as string | null },
    openrouter: { configured: false, hint: null as string | null },
    groq: { configured: false, hint: null as string | null },
    openai: { configured: false, hint: null as string | null },
  };
  let storageAvailable = true;

  try {
    const { getStoredApiStatus } = await import("@/services/integrations/api-key-store");
    stored = await getStoredApiStatus();
  } catch {
    storageAvailable = false;
  }

  const providerName = FREE_FIRST_ORDER.includes(provider.name as UserAiProvider)
    ? (provider.name as UserAiProvider)
    : null;
  const config = providerName ? modelConfig(providerName) : getModelConfig();
  return {
    provider: provider.name,
    model: config.coach,
    mock: provider.name === "mock",
    freeTier: provider.name === "gemini" || provider.name === "openrouter" || provider.name === "groq",
    storageAvailable,
    stored,
    fallbackOrder: orderedProviderNames(stored.preferred).filter(
      (name) => Boolean(stored[name].configured || envKey(name))
    ),
    environment: {
      gemini: Boolean(env.GEMINI_API_KEY),
      openrouter: Boolean(env.OPENROUTER_API_KEY),
      groq: Boolean(env.GROQ_API_KEY),
      openai: Boolean(env.OPENAI_API_KEY),
    },
  };
}

export function createAiProviderFromKey(provider: UserAiProvider, apiKey: string): AiProvider {
  return createProvider(provider, apiKey);
}

export function isMockMode(): boolean {
  return getAiProvider().name === "mock";
}
