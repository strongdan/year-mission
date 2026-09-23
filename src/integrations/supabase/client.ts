import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import { env, hasSupabaseConfig } from "@/lib/env";

export function createBrowserClient(options?: { flowType?: "pkce" | "implicit" }) {
  if (!hasSupabaseConfig) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  if (options?.flowType) {
    return createSupabaseBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { flowType: options.flowType },
    });
  }

  return createSupabaseBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
