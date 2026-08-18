import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_DAILY_BUDGET_USD: z.coerce.number().default(0.5),
  AI_MONTHLY_BUDGET_USD: z.coerce.number().default(10),
  AI_MOCK_MODE: z
    .enum(["auto", "force"])
    .default("auto"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "[env] Invalid environment:",
    parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
  );
}

export const env = parsed.success
  ? parsed.data
  : {
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
      SUPABASE_SERVICE_ROLE_KEY: undefined,
      OPENAI_API_KEY: undefined,
      AI_DAILY_BUDGET_USD: 0.5,
      AI_MONTHLY_BUDGET_USD: 10,
      AI_MOCK_MODE: "auto",
    } as const;

export const hasSupabaseConfig =
  Boolean(env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const aiMockMode = env.AI_MOCK_MODE;
