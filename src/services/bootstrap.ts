import { getProfile, listDomains } from "@/repositories/supabase-repository";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface BootstrapResult {
  profileExists: boolean;
  domainsSeeded: boolean;
  bootstrapped: boolean;
}

/**
 * On first login, seed the canonical four domains, the one-year plan, and
 * the four seasons via the database RPC (security definer, user-scoped).
 */
export async function ensureBootstrapped(userId: string, supabase: SupabaseClient | null): Promise<BootstrapResult> {
  if (!supabase) return { profileExists: false, domainsSeeded: false, bootstrapped: false };

  const profile = await getProfile(userId);
  const domains = await listDomains(userId);

  let bootstrapped = false;
  if (domains.length < 4) {
    const { error } = await supabase.rpc("bootstrap_user");
    if (!error) {
      bootstrapped = true;
    }
  }

  return {
    profileExists: Boolean(profile),
    domainsSeeded: domains.length >= 4,
    bootstrapped,
  };
}