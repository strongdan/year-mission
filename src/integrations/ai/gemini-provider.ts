import "server-only";
import type { AiMessageInput, AiProvider, ModelConfig } from "./provider";

export interface GeminiProviderOptions {
  apiKey: string;
  modelConfig: ModelConfig;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
  error?: { message?: string };
}

function toGeminiRequest(messages: AiMessageInput[], maxTokens: number) {
  const systemText = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");

  const contents = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

  return {
    ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
    contents,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.45,
    },
  };
}

export function createGeminiProvider({ apiKey, modelConfig }: GeminiProviderOptions): AiProvider {
  return {
    name: "gemini",
    async complete({ messages, modelKind, maxTokens = 1024 }) {
      const started = Date.now();
      const model = modelKind === "coach" ? modelConfig.coach : modelConfig.cheap;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(toGeminiRequest(messages, maxTokens)),
          cache: "no-store",
        }
      );

      const data = (await res.json()) as GeminiResponse;
      if (!res.ok) {
        throw new Error(data.error?.message || `Gemini request failed (${res.status}).`);
      }

      const content =
        data.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("")
          .trim() ?? "";

      if (!content) throw new Error("Gemini returned an empty response.");

      const inputTokens = data.usageMetadata?.promptTokenCount ?? 0;
      const outputTokens = data.usageMetadata?.candidatesTokenCount ?? 0;
      const costPer1kIn = modelKind === "coach" ? modelConfig.coachCostPer1kIn : modelConfig.cheapCostPer1kIn;
      const costPer1kOut = modelKind === "coach" ? modelConfig.coachCostPer1kOut : modelConfig.cheapCostPer1kOut;

      return {
        content,
        model,
        inputTokens,
        outputTokens,
        estimatedCost: (inputTokens / 1000) * costPer1kIn + (outputTokens / 1000) * costPer1kOut,
        latencyMs: Date.now() - started,
        provider: "gemini",
      };
    },
  };
}
