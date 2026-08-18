import type { AiProvider, ModelConfig } from "./provider";

/**
 * Deterministic mock provider used when no API key is configured. Lets the
 * app be fully usable in development without OpenAI access.
 */
export function createMockProvider(modelConfig: ModelConfig): AiProvider {
  return {
    name: "mock",
    async complete({ messages, modelKind }) {
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      const inputTokens = messages.reduce((n, m) => n + m.content.length, 0);
      const outputTokens = 220;
      const model = modelKind === "coach" ? modelConfig.coach : modelConfig.cheap;
      const costPer1kIn = modelKind === "coach" ? modelConfig.coachCostPer1kIn : modelConfig.cheapCostPer1kIn;
      const costPer1kOut = modelKind === "coach" ? modelConfig.coachCostPer1kOut : modelConfig.cheapCostPer1kOut;

      return {
        content: mockCoachReply(lastUser?.content ?? ""),
        model,
        inputTokens,
        outputTokens,
        estimatedCost: (inputTokens / 1000) * costPer1kIn + (outputTokens / 1000) * costPer1kOut,
        latencyMs: 24,
        provider: "mock",
      };
    },
  };
}

export function mockCoachReply(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes("defer") || lower.includes("avoid")) {
    return "Repeated deferral is often a size or clarity problem. Pick the smallest physical next action and schedule it as a 10-minute start. Break it down if it still feels heavy.";
  }

  if (lower.includes("week") || lower.includes("prioriti")) {
    return "Keep the Big Four in place: 2 workouts, 1 money review, 1 house block, 1 career block. Choose one Weekly Win — the single highest-impact thing — and make sure Today holds only what is genuinely best done now.";
  }

  if (lower.includes("plan") || lower.includes("optimize") || lower.includes("restructure")) {
    return "You have enough of a plan. The next physical action is more valuable than further planning. Spend 15 minutes on the current task and come back afterward.";
  }

  if (lower.includes("what should i do") || lower.includes("30 minute") || lower.includes("right now")) {
    return "Do the smallest unfinished thing from Today's list that also advances a deferred task. Keep it under 30 minutes.";
  }

  if (lower.includes("experiment") || lower.includes("cold") || lower.includes("meditat")) {
    return "Treat that as an experiment with a clear target metric and an end date. Keep at most two experiments active — they should not silently become obligations.";
  }

  return "What matters this week: protect the Big Four, pick one Weekly Win, and put nothing on Today you don't intend to do. If a task keeps getting deferred, shrink it.";
}