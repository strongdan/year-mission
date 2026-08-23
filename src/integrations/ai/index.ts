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

export function isMockMode(): boolean {
  return getAiProvider().name === "mock";
}
