import { OpenAI } from "openai";
import type { AiProvider, ModelConfig } from "./provider";

export interface OpenAiProviderOptions {
  apiKey: string;
  modelConfig: ModelConfig;
}

export function createOpenAiProvider({ apiKey, modelConfig }: OpenAiProviderOptions): AiProvider {
  const client = new OpenAI({ apiKey });

  return {
    name: "openai",
    async complete({ messages, modelKind, maxTokens = 1024 }) {
      const started = Date.now();
      const model = modelKind === "coach" ? modelConfig.coach : modelConfig.cheap;
      const response = await client.responses.create({
        model,
        input: messages.map((m) => ({ role: m.role, content: m.content })),
        max_output_tokens: maxTokens,
      });

      const usage = response.usage;
      const inputTokens = usage?.input_tokens ?? 0;
      const outputTokens = usage?.output_tokens ?? 0;
      const costPer1kIn = modelKind === "coach" ? modelConfig.coachCostPer1kIn : modelConfig.cheapCostPer1kIn;
      const costPer1kOut = modelKind === "coach" ? modelConfig.coachCostPer1kOut : modelConfig.cheapCostPer1kOut;
      const estimatedCost = (inputTokens / 1000) * costPer1kIn + (outputTokens / 1000) * costPer1kOut;

      return {
        content: response.output_text,
        model,
        inputTokens,
        outputTokens,
        estimatedCost,
        latencyMs: Date.now() - started,
        provider: "openai",
      };
    },
  };
}