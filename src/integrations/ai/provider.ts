export type AiRole = "system" | "user" | "assistant";
export type ModelKind = "cheap" | "coach";

export interface AiMessageInput {
  role: AiRole;
  content: string;
}

export interface AiCompletionResult {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  latencyMs: number;
  provider: string;
}

export interface AiProvider {
  readonly name: string;
  complete(params: {
    messages: AiMessageInput[];
    modelKind: ModelKind;
    maxTokens?: number;
  }): Promise<AiCompletionResult>;
}

export interface ModelConfig {
  cheap: string;
  coach: string;
  cheapCostPer1kIn: number;
  cheapCostPer1kOut: number;
  coachCostPer1kIn: number;
  coachCostPer1kOut: number;
}

export const OPENAI_MODELS: ModelConfig = {
  cheap: "gpt-4.1-nano",
  coach: "gpt-4.1-mini",
  cheapCostPer1kIn: 0.0001,
  cheapCostPer1kOut: 0.0004,
  coachCostPer1kIn: 0.0004,
  coachCostPer1kOut: 0.0016,
};