import "server-only";

import { createAdminClient } from "@/integrations/supabase/server";
import type { GoogleConnection } from "@/types/models";

type GoogleConnectionPatch = Partial<
  Pick<GoogleConnection, "google_user_id" | "email" | "refresh_token" | "token_encrypted" | "scope">
>;

async function adminClient() {
  const admin = await createAdminClient();
  if (!admin) throw new Error("Server database access is not configured.");
  return admin;
}

/**
 * Persist the one canonical Google connection for a Year Mission user.
 *
 * google_connections has a generated primary key plus a separate unique user_id
 * constraint. Supabase/PostgREST otherwise defaults an upsert conflict target to
 * the primary key, which can turn a reconnect into a user_id unique-key failure.
 */
export async function upsertGoogleConnectionForUser(userId: string, patch: GoogleConnectionPatch): Promise<void> {
  const admin = await adminClient();
  const { error } = await admin
    .from("google_connections")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });

  if (error) throw new Error(`Could not save Google connection: ${error.message}`);
}

/** Update an existing connection without ever attempting an insert. */
export async function updateGoogleConnectionForUser(userId: string, patch: GoogleConnectionPatch): Promise<void> {
  const admin = await adminClient();
  const { error } = await admin.from("google_connections").update(patch).eq("user_id", userId);
  if (error) throw new Error(`Could not update Google connection: ${error.message}`);
}

export async function clearGoogleConnectionCredentials(userId: string): Promise<void> {
  await updateGoogleConnectionForUser(userId, {
    refresh_token: null,
    token_encrypted: false,
    email: null,
    google_user_id: null,
    scope: null,
  });
}
