import { getAiProviderForRequest } from "@/integrations/ai";
import { COACH_SYSTEM_PROMPT } from "./prompt";
import { serializeContext, type CoachContextPacket } from "./context";

export interface CoachChatResult {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  latencyMs: number;
  provider: string;
}

export const COACH_PROVIDER_UNAVAILABLE_MESSAGE =
  "Coach could not reach the selected AI provider. Open Settings → AI, test the connection, and replace the key if needed. Your Year Mission data is still available; only this Coach reply failed.";

export class CoachService {
  async chat(params: {
    message: string;
    context: CoachContextPacket;
    history: { role: "user" | "assistant"; content: string }[];
  }): Promise<CoachChatResult> {
    const provider = await getAiProviderForRequest();
    const context = serializeContext(params.context);
    const historyMessages = params.history.slice(-10);

    const messages = [
      { role: "system" as const, content: COACH_SYSTEM_PROMPT },
      { role: "user" as const, content: `Current user state (JSON):\n${context}` },
      ...historyMessages,
      { role: "user" as const, content: params.message },
    ];

    try {
      const result = await provider.complete({
        messages,
        modelKind: "coach",
        maxTokens: 700,
      });

      return {
        content: result.content,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        estimatedCost: result.estimatedCost,
        latencyMs: result.latencyMs,
        provider: result.provider,
      };
    } catch {
      // Provider errors can contain credential/provider response details. Do not
      // echo or log the raw exception; surface an actionable, non-secret state.
      console.error("Coach AI provider request failed.");
      return {
        content: COACH_PROVIDER_UNAVAILABLE_MESSAGE,
        model: "unavailable",
        inputTokens: 0,
        outputTokens: 0,
        estimatedCost: 0,
        latencyMs: 0,
        provider: "unavailable",
      };
    }
  }
}

export const coachService = new CoachService();