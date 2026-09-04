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

// Gemini Developer API free-tier deployment. If billing is enabled later,
// revisit cost accounting rather than silently assuming requests are free.
export const GEMINI_MODELS: ModelConfig = {
  cheap: "gemini-3.5-flash-lite",
  coach: "gemini-3.6-flash",
  cheapCostPer1kIn: 0,
  cheapCostPer1kOut: 0,
  coachCostPer1kIn: 0,
  coachCostPer1kOut: 0,
};

// OpenRouter's free router chooses among currently available zero-cost models.
export const OPENROUTER_MODELS: ModelConfig = {
  cheap: "openrouter/free",
  coach: "openrouter/free",
  cheapCostPer1kIn: 0,
  cheapCostPer1kOut: 0,
  coachCostPer1kIn: 0,
  coachCostPer1kOut: 0,
};

// Groq GPT-OSS pricing as of 2026-09. Keep these values current if Groq pricing changes.
export const GROQ_MODELS: ModelConfig = {
  cheap: "openai/gpt-oss-20b",
  coach: "openai/gpt-oss-120b",
  cheapCostPer1kIn: 0.000075,
  cheapCostPer1kOut: 0.0003,
  coachCostPer1kIn: 0.00015,
  coachCostPer1kOut: 0.0006,
};
