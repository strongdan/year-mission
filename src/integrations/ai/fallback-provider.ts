import "server-only";

import type { AiProvider } from "./provider";

export interface FallbackAttempt {
  provider: string;
  error: string;
}

export class AiFallbackExhaustedError extends Error {
  readonly attempts: FallbackAttempt[];

  constructor(attempts: FallbackAttempt[]) {
    super("AI providers are temporarily unavailable. Try again shortly.");
    this.name = "AiFallbackExhaustedError";
    this.attempts = attempts;
  }
}

const circuitUntil = new Map<string, number>();

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? "Unknown AI provider error");
}

async function withTimeout<T>(work: Promise<T>, timeoutMs: number, provider: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${provider} timed out after ${timeoutMs}ms.`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function createFallbackProvider(
  providers: AiProvider[],
  options: { timeoutMs?: number; cooldownMs?: number } = {}
): AiProvider {
  const timeoutMs = options.timeoutMs ?? 15_000;
  const cooldownMs = options.cooldownMs ?? 60_000;
  const uniqueProviders = providers.filter(
    (provider, index, all) => all.findIndex((candidate) => candidate.name === provider.name) === index
  );

  if (uniqueProviders.length === 0) throw new Error("At least one AI provider is required.");

  return {
    name: uniqueProviders[0].name,
    async complete(params) {
      const attempts: FallbackAttempt[] = [];
      const now = Date.now();

      for (const provider of uniqueProviders) {
        const unavailableUntil = circuitUntil.get(provider.name) ?? 0;
        if (unavailableUntil > now) {
          attempts.push({ provider: provider.name, error: "Temporarily skipped after a recent failure." });
          continue;
        }

        try {
          return await withTimeout(provider.complete(params), timeoutMs, provider.name);
        } catch (error) {
          attempts.push({ provider: provider.name, error: errorMessage(error).slice(0, 240) });
          circuitUntil.set(provider.name, Date.now() + cooldownMs);
        }
      }

      throw new AiFallbackExhaustedError(attempts);
    },
  };
}

/** Test-only helper; harmless in production and avoids time-dependent test leakage. */
export function resetAiProviderCircuits(): void {
  circuitUntil.clear();
}
