import { env, aiMockMode } from "@/lib/env";
import type { AiProvider, ModelConfig } from "./provider";
import { OPENAI_MODELS } from "./provider";
import { createOpenAiProvider } from "./openai-provider";
import { createMockProvider } from "./mock-provider";

let cachedProvider: AiProvider | null = null;

export function getModelConfig(): ModelConfig {
  return OPENAI_MODELS;
}

export function getAiProvider(): AiProvider {
  if (cachedProvider) return cachedProvider;

  const apiKey = env.OPENAI_API_KEY;
  const forceMock = aiMockMode === "force";
  const useReal = apiKey && !forceMock;

  cachedProvider = useReal
    ? createOpenAiProvider({ apiKey, modelConfig: getModelConfig() })
    : createMockProvider(getModelConfig());

  return cachedProvider;
}

export function isMockMode(): boolean {
  return getAiProvider().name === "mock";
}