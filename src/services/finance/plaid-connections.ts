import "server-only";

import { createAdminClient } from "@/integrations/supabase/server";
import { decryptFinanceSecret, encryptFinanceSecret } from "./secret-store";

export interface PlaidConnectionMetadata {
  id: string;
  itemId: string;
  displayName: string | null;
  status: "active" | "reconnect_required" | "disconnected" | "error";
  lastSyncedAt: string | null;
  lastErrorCode: string | null;
  consentExpiresAt: string | null;
}

interface PlaidConnectionSecret extends PlaidConnectionMetadata {
  accessToken: string;
  cursor: string | null;
}

async function admin() {
  const client = await createAdminClient();
  if (!client) throw new Error("Server database access is not configured.");
  return client;
}

function metadata(row: Record<string, unknown>): PlaidConnectionMetadata {
  return {
    id: String(row.id),
    itemId: String(row.provider_connection_id),
    displayName: typeof row.display_name === "string" ? row.display_name : null,
    status: (row.status as PlaidConnectionMetadata["status"]) ?? "error",
    lastSyncedAt: typeof row.last_synced_at === "string" ? row.last_synced_at : null,
    lastErrorCode: typeof row.last_error_code === "string" ? row.last_error_code : null,
    consentExpiresAt: typeof row.consent_expires_at === "string" ? row.consent_expires_at : null,
  };
}

export async function listPlaidConnections(userId: string): Promise<PlaidConnectionMetadata[]> {
  const client = await admin();
  const { data, error } = await client
    .from("finance_connections")
    .select("id,provider_connection_id,display_name,status,last_synced_at,last_error_code,consent_expires_at")
    .eq("user_id", userId)
    .eq("provider", "plaid")
    .neq("status", "disconnected")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => metadata(row as Record<string, unknown>));
}

export async function savePlaidConnection(
  userId: string,
  input: { itemId: string; accessToken: string; displayName?: string | null }
): Promise<PlaidConnectionMetadata> {
  const client = await admin();
  const { data, error } = await client
    .from("finance_connections")
    .upsert({
      user_id: userId,
      provider: "plaid",
      provider_connection_id: input.itemId,
      credential_ciphertext: encryptFinanceSecret(input.accessToken),
      display_name: input.displayName ?? null,
      status: "active",
      last_error_code: null,
    }, { onConflict: "user_id,provider,provider_connection_id" })
    .select("id,provider_connection_id,display_name,status,last_synced_at,last_error_code,consent_expires_at")
    .single();
  if (error) throw error;
  return metadata(data as Record<string, unknown>);
}

export async function getPlaidConnectionSecret(userId: string, connectionId: string): Promise<PlaidConnectionSecret | null> {
  const client = await admin();
  const { data, error } = await client
    .from("finance_connections")
    .select("id,provider_connection_id,display_name,status,last_synced_at,last_error_code,consent_expires_at,credential_ciphertext,sync_cursor")
    .eq("id", connectionId)
    .eq("user_id", userId)
    .eq("provider", "plaid")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    ...metadata(row),
    accessToken: decryptFinanceSecret(String(row.credential_ciphertext)),
    cursor: typeof row.sync_cursor === "string" ? row.sync_cursor : null,
  };
}

export async function updatePlaidConnectionSync(
  userId: string,
  connectionId: string,
  input: { cursor: string; status?: PlaidConnectionMetadata["status"]; errorCode?: string | null; consentExpiresAt?: string | null }
): Promise<void> {
  const client = await admin();
  const { error } = await client
    .from("finance_connections")
    .update({
      sync_cursor: input.cursor,
      status: input.status ?? "active",
      last_error_code: input.errorCode ?? null,
      consent_expires_at: input.consentExpiresAt ?? null,
      last_synced_at: new Date().toISOString(),
    })
    .eq("id", connectionId)
    .eq("user_id", userId)
    .eq("provider", "plaid");
  if (error) throw error;
}

export async function markPlaidConnectionError(
  userId: string,
  connectionId: string,
  status: "reconnect_required" | "error",
  errorCode: string | null
): Promise<void> {
  const client = await admin();
  const { error } = await client
    .from("finance_connections")
    .update({ status, last_error_code: errorCode })
    .eq("id", connectionId)
    .eq("user_id", userId)
    .eq("provider", "plaid");
  if (error) throw error;
}

export async function deletePlaidConnection(userId: string, connectionId: string): Promise<void> {
  const client = await admin();
  const { error } = await client
    .from("finance_connections")
    .delete()
    .eq("id", connectionId)
    .eq("user_id", userId)
    .eq("provider", "plaid");
  if (error) throw error;
}
