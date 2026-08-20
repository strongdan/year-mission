import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("keeps valid Supabase config when optional AI settings are malformed", () => {
    const parsed = parseEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      OPENAI_API_KEY: undefined,
      AI_DAILY_BUDGET_USD: "[SENSITIVE]",
      AI_MONTHLY_BUDGET_USD: "[SENSITIVE]",
      AI_MOCK_MODE: "[SENSITIVE]",
    });

    expect(parsed.env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
    expect(parsed.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("anon-key");
    expect(parsed.env.AI_DAILY_BUDGET_USD).toBe(0.5);
    expect(parsed.env.AI_MONTHLY_BUDGET_USD).toBe(10);
    expect(parsed.env.AI_MOCK_MODE).toBe("auto");
    expect(parsed.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining("AI_DAILY_BUDGET_USD"),
        expect.stringContaining("AI_MONTHLY_BUDGET_USD"),
        expect.stringContaining("AI_MOCK_MODE"),
      ])
    );
  });
});
