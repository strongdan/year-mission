import { z } from "zod";

const rawEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  AI_PROVIDER: z.enum(["auto", "gemini", "openai", "mock"]).default("auto"),
  AI_DAILY_BUDGET_USD: z.coerce.number().default(0.5),
  AI_MONTHLY_BUDGET_USD: z.coerce.number().default(10),
  AI_MOCK_MODE: z
    .enum(["auto", "force"])
    .default("auto"),
});

export type AppEnv = z.infer<typeof rawEnvSchema>;

const rawEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  AI_PROVIDER: process.env.AI_PROVIDER,
  AI_DAILY_BUDGET_USD: process.env.AI_DAILY_BUDGET_USD,
  AI_MONTHLY_BUDGET_USD: process.env.AI_MONTHLY_BUDGET_USD,
  AI_MOCK_MODE: process.env.AI_MOCK_MODE,
};

const fieldSchemas = rawEnvSchema.shape;

const defaults = {
  AI_PROVIDER: "auto",
  AI_DAILY_BUDGET_USD: 0.5,
  AI_MONTHLY_BUDGET_USD: 10,
  AI_MOCK_MODE: "auto",
} as const;

export function parseEnv(input: typeof rawEnv): { env: AppEnv; issues: string[] } {
  const issues: string[] = [];
  const parsed = {
    NEXT_PUBLIC_SUPABASE_URL: undefined,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
    SUPABASE_SERVICE_ROLE_KEY: undefined,
    OPENAI_API_KEY: undefined,
    GEMINI_API_KEY: undefined,
    ...defaults,
  } satisfies AppEnv;

  for (const key of Object.keys(fieldSchemas) as Array<keyof typeof fieldSchemas>) {
    const result = fieldSchemas[key].safeParse(input[key]);
    if (result.success) {
      Object.assign(parsed, { [key]: result.data });
    } else {
      issues.push(`${key}: ${result.error.issues.map((i) => i.message).join(", ")}`);
    }
  }

  return { env: parsed, issues };
}

const parsed = parseEnv(rawEnv);

if (parsed.issues.length > 0) {
  console.error("[env] Invalid environment:", parsed.issues.join("; "));
}

export const env = parsed.env;

export const hasSupabaseConfig =
  Boolean(env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const aiMockMode = env.AI_MOCK_MODE;
