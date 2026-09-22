import { createAdminClient } from "@/integrations/supabase/server";

// Resolve production-only credentials at request time, not while a route is built.
export async function getSupabaseServer() {
  return createAdminClient();
}
