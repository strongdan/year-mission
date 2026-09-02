import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("keeps valid Supabase config when optional AI settings are malformed", () => {
    const parsed = parseEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      OPENAI_API_KEY: undefined,
      GEMINI_API_KEY: undefined,
      OPENROUTER_API_KEY: undefined,
      GROQ_API_KEY: undefined,
      AI_PROVIDER: "[SENSITIVE]",
      AI_DAILY_BUDGET_USD: "[SENSITIVE]",
      AI_MONTHLY_BUDGET_USD: "[SENSITIVE]",
      AI_MOCK_MODE: "[SENSITIVE]",
    });

    expect(parsed.env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
    expect(parsed.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("anon-key");
    expect(parsed.env.AI_PROVIDER).toBe("auto");
    expect(parsed.env.AI_DAILY_BUDGET_USD).toBe(0.5);
    expect(parsed.env.AI_MONTHLY_BUDGET_USD).toBe(10);
    expect(parsed.env.AI_MOCK_MODE).toBe("auto");
    expect(parsed.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining("AI_PROVIDER"),
        expect.stringContaining("AI_DAILY_BUDGET_USD"),
        expect.stringContaining("AI_MONTHLY_BUDGET_USD"),
        expect.stringContaining("AI_MOCK_MODE"),
      ])
    );
  });

  it("accepts Gemini as an AI provider", () => {
    const parsed = parseEnv({
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
      SUPABASE_SERVICE_ROLE_KEY: undefined,
      OPENAI_API_KEY: undefined,
      GEMINI_API_KEY: "gemini-key",
      OPENROUTER_API_KEY: undefined,
      GROQ_API_KEY: undefined,
      AI_PROVIDER: "gemini",
      AI_DAILY_BUDGET_USD: undefined,
      AI_MONTHLY_BUDGET_USD: undefined,
      AI_MOCK_MODE: undefined,
    });

    expect(parsed.env.GEMINI_API_KEY).toBe("gemini-key");
    expect(parsed.env.AI_PROVIDER).toBe("gemini");
    expect(parsed.issues).toEqual([]);
  });

  it("accepts OpenRouter and Groq free-provider configuration", () => {
    const openRouter = parseEnv({
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
      SUPABASE_SERVICE_ROLE_KEY: undefined,
      OPENAI_API_KEY: undefined,
      GEMINI_API_KEY: undefined,
      OPENROUTER_API_KEY: "openrouter-key",
      GROQ_API_KEY: undefined,
      AI_PROVIDER: "openrouter",
      AI_DAILY_BUDGET_USD: undefined,
      AI_MONTHLY_BUDGET_USD: undefined,
      AI_MOCK_MODE: undefined,
    });
    const groq = parseEnv({
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
      SUPABASE_SERVICE_ROLE_KEY: undefined,
      OPENAI_API_KEY: undefined,
      GEMINI_API_KEY: undefined,
      OPENROUTER_API_KEY: undefined,
      GROQ_API_KEY: "groq-key",
      AI_PROVIDER: "groq",
      AI_DAILY_BUDGET_USD: undefined,
      AI_MONTHLY_BUDGET_USD: undefined,
      AI_MOCK_MODE: undefined,
    });

    expect(openRouter.env.AI_PROVIDER).toBe("openrouter");
    expect(openRouter.env.OPENROUTER_API_KEY).toBe("openrouter-key");
    expect(groq.env.AI_PROVIDER).toBe("groq");
    expect(groq.env.GROQ_API_KEY).toBe("groq-key");
    expect(openRouter.issues).toEqual([]);
    expect(groq.issues).toEqual([]);
  });
});
