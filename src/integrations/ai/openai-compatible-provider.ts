import "server-only";

import type { AiProvider, ModelConfig } from "./provider";

interface CompatibleProviderOptions {
  name: string;
  apiKey: string;
  baseUrl: string;
  modelConfig: ModelConfig;
  extraHeaders?: Record<string, string>;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  error?: { message?: string };
}

export function createOpenAiCompatibleProvider({
  name,
  apiKey,
  baseUrl,
  modelConfig,
  extraHeaders = {},
}: CompatibleProviderOptions): AiProvider {
  return {
    name,
    async complete({ messages, modelKind, maxTokens = 1024 }) {
      const started = Date.now();
      const model = modelKind === "coach" ? modelConfig.coach : modelConfig.cheap;
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
          ...extraHeaders,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature: 0.45,
        }),
        cache: "no-store",
      });

      const data = (await response.json().catch(() => ({}))) as ChatCompletionResponse;
      if (!response.ok) {
        throw new Error(data.error?.message || `${name} request failed (${response.status}).`);
      }

      const content = data.choices?.[0]?.message?.content?.trim() ?? "";
      if (!content) throw new Error(`${name} returned an empty response.`);

      const inputTokens = data.usage?.prompt_tokens ?? 0;
      const outputTokens = data.usage?.completion_tokens ?? 0;
      const costPer1kIn = modelKind === "coach" ? modelConfig.coachCostPer1kIn : modelConfig.cheapCostPer1kIn;
      const costPer1kOut = modelKind === "coach" ? modelConfig.coachCostPer1kOut : modelConfig.cheapCostPer1kOut;

      return {
        content,
        model,
        inputTokens,
        outputTokens,
        estimatedCost: (inputTokens / 1000) * costPer1kIn + (outputTokens / 1000) * costPer1kOut,
        latencyMs: Date.now() - started,
        provider: name,
      };
    },
  };
}
