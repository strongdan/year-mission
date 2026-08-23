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
  }
}

export const coachService = new CoachService();