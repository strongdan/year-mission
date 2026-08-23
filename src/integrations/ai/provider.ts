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

// These models currently have a Gemini Developer API free tier. Keep costs at
// zero for the intended free-tier deployment; if billing is enabled later,
// revisit cost accounting rather than silently assuming requests are free.
export const GEMINI_MODELS: ModelConfig = {
  cheap: "gemini-3.5-flash-lite",
  coach: "gemini-3.6-flash",
  cheapCostPer1kIn: 0,
  cheapCostPer1kOut: 0,
  coachCostPer1kIn: 0,
  coachCostPer1kOut: 0,
};
