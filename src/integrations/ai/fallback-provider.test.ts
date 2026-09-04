import { beforeEach, describe, expect, it } from "vitest";
import type { AiProvider } from "./provider";
import { AiFallbackExhaustedError, createFallbackProvider, resetAiProviderCircuits } from "./fallback-provider";

function provider(name: string, complete: AiProvider["complete"]): AiProvider {
  return { name, complete };
}

describe("AI provider fallback", () => {
  beforeEach(() => resetAiProviderCircuits());

  it("uses the next provider when the first one fails", async () => {
    const first = provider("first", async () => { throw new Error("rate limited"); });
    const second = provider("second", async () => ({
      content: "ok",
      model: "test",
      inputTokens: 1,
      outputTokens: 1,
      estimatedCost: 0,
      latencyMs: 1,
      provider: "second",
    }));

    const result = await createFallbackProvider([first, second], { timeoutMs: 50 }).complete({
      messages: [{ role: "user", content: "test" }],
      modelKind: "cheap",
    });

    expect(result.provider).toBe("second");
    expect(result.content).toBe("ok");
  });

  it("opens a short circuit after a provider failure", async () => {
    let firstCalls = 0;
    const first = provider("first", async () => {
      firstCalls += 1;
      throw new Error("unavailable");
    });
    const second = provider("second", async () => ({
      content: "fallback",
      model: "test",
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      latencyMs: 0,
      provider: "second",
    }));
    const fallback = createFallbackProvider([first, second], { timeoutMs: 50, cooldownMs: 10_000 });

    await fallback.complete({ messages: [{ role: "user", content: "one" }], modelKind: "cheap" });
    await fallback.complete({ messages: [{ role: "user", content: "two" }], modelKind: "cheap" });

    expect(firstCalls).toBe(1);
  });

  it("returns a bounded friendly error when every provider fails", async () => {
    const fallback = createFallbackProvider([
      provider("one", async () => { throw new Error("one down"); }),
      provider("two", async () => { throw new Error("two down"); }),
    ], { timeoutMs: 50 });

    await expect(fallback.complete({
      messages: [{ role: "user", content: "test" }],
      modelKind: "coach",
    })).rejects.toBeInstanceOf(AiFallbackExhaustedError);
  });
});
