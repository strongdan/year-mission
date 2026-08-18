import "server-only";
import { createServerClientForApp } from "@/integrations/supabase/server";

export async function requireUser() {
  const supabase = await createServerClientForApp();
  if (!supabase) {
    return { supabase: null, user: null };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { ensureBootstrapped } = await import("@/services/bootstrap");
    await ensureBootstrapped(user.id, supabase);
  }
  return { supabase, user };
}

export async function getSession() {
  const supabase = await createServerClientForApp();
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}