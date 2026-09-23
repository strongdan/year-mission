import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import { hasSupabaseConfig, publicSupabaseAnonKey, publicSupabaseUrl } from "@/lib/env";

export function createBrowserClient(options?: { flowType?: "pkce" | "implicit" }) {
  if (!hasSupabaseConfig) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return createSupabaseBrowserClient(
    publicSupabaseUrl,
    publicSupabaseAnonKey,
    options?.flowType ? { auth: { flowType: options.flowType } } : undefined,
  );
}
