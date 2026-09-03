"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { financeImportSchema, financeLiabilitySchema } from "@/domain/finance";
import { requireUser } from "@/lib/auth";
import { claimSimpleFinSetupToken, fetchSimpleFinImport } from "@/services/finance/simplefin";
import {
  clearSimpleFinAccessUrl,
  getSimpleFinAccessUrl,
  getSimpleFinConnectionStatus,
  setSimpleFinAccessUrl,
} from "@/services/finance/secret-store";
import {
  createPlaidLinkToken,
  createPlaidUpdateLinkToken,
  exchangePlaidPublicToken,
  fetchPlaidImport,
  getPlaidConfigurationStatus,
  plaidNeedsReconnect,
  PlaidApiError,
  removePlaidItem,
} from "@/services/finance/plaid";
import {
  deletePlaidConnection,
  getPlaidConnectionSecret,
  listPlaidConnections,
  markPlaidConnectionError,
  savePlaidConnection,
  updatePlaidConnectionSync,
} from "@/services/finance/plaid-connections";
import {
  getFinanceDashboard,
  persistFinanceImport,
  upsertManualLiability,
} from "@/services/finance/finance-service";

const UUID_Z = z.string().uuid();

function revalidateFinance() {
  for (const path of ["/money", "/progress", "/settings", "/coach"]) revalidatePath(path);
}

function safeError(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message.slice(0, 300);
  return fallback;
}

async function deleteRemovedPlaidTransactions(
  userId: string,
  supabase: NonNullable<Awaited<ReturnType<typeof requireUser>>["supabase"]>,
  ids: string[]
) {
  for (let index = 0; index < ids.length; index += 100) {
    const chunk = ids.slice(index, index + 100);
    const { error } = await supabase
      .from("finance_transactions")
      .delete()
      .eq("user_id", userId)
      .eq("provider", "plaid")
      .in("provider_transaction_id", chunk);
    if (error) throw error;
  }
}

async function syncPlaidConnectionForUser(
  userId: string,
  supabase: NonNullable<Awaited<ReturnType<typeof requireUser>>["supabase"]>,
  connectionId: string
) {
  const connection = await getPlaidConnectionSecret(userId, connectionId);
  if (!connection) throw new Error("Plaid connection not found.");

  try {
    const result = await fetchPlaidImport(connection.accessToken, connection.displayName, connection.cursor);
    await deleteRemovedPlaidTransactions(userId, supabase, result.removedTransactionIds);
    const summary = await persistFinanceImport(userId, supabase, result.importData);
    await updatePlaidConnectionSync(userId, connection.id, {
      cursor: result.nextCursor,
      status: "active",
      errorCode: null,
      consentExpiresAt: connection.consentExpiresAt,
    });
    return summary;
  } catch (error) {
    await markPlaidConnectionError(
      userId,
      connection.id,
      plaidNeedsReconnect(error) ? "reconnect_required" : "error",
      error instanceof PlaidApiError ? error.code : null
    ).catch(() => undefined);
    throw error;
  }
}

export async function getFinanceStatusAction() {
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return { ok: false as const, error: "Not signed in." };
  try {
    const [simplefin, plaidConnections, dashboard] = await Promise.all([
      getSimpleFinConnectionStatus(),
      listPlaidConnections(user.id),
      getFinanceDashboard(user.id, supabase),
    ]);
    return {
      ok: true as const,
      data: {
        simplefin,
        plaid: { ...getPlaidConfigurationStatus(), connections: plaidConnections },
        dashboard,
      },
    };
  } catch (error) {
    return { ok: false as const, error: safeError(error, "Finance status could not be loaded.") };
  }
}

export async function createPlaidLinkTokenAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  try {
    return { ok: true as const, data: { linkToken: await createPlaidLinkToken(user.id) } };
  } catch (error) {
    return { ok: false as const, error: safeError(error, "Plaid Link could not be started.") };
  }
}

export async function createPlaidReconnectTokenAction(connectionId: string) {
  const parsed = UUID_Z.safeParse(connectionId);
  if (!parsed.success) return { ok: false as const, error: "Invalid Plaid connection." };
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  try {
    const connection = await getPlaidConnectionSecret(user.id, parsed.data);
    if (!connection) return { ok: false as const, error: "Plaid connection not found." };
    return {
      ok: true as const,
      data: { linkToken: await createPlaidUpdateLinkToken(user.id, connection.accessToken) },
    };
  } catch (error) {
    return { ok: false as const, error: safeError(error, "Plaid reconnection could not be started.") };
  }
}

export async function exchangePlaidPublicTokenAction(input: { publicToken: string; institutionName?: string | null }) {
  const token = z.string().trim().min(10).max(2000).safeParse(input.publicToken);
  const institution = z.string().trim().max(200).nullable().optional().safeParse(input.institutionName ?? null);
  if (!token.success || !institution.success) return { ok: false as const, error: "Plaid returned invalid connection data." };

  const { user, supabase } = await requireUser();
  if (!user || !supabase) return { ok: false as const, error: "Not signed in." };

  try {
    const exchanged = await exchangePlaidPublicToken(token.data);
    const connection = await savePlaidConnection(user.id, {
      itemId: exchanged.itemId,
      accessToken: exchanged.accessToken,
      displayName: institution.data ?? null,
    });
    const summary = await syncPlaidConnectionForUser(user.id, supabase, connection.id);
    revalidateFinance();
    return { ok: true as const, data: { connection, summary } };
  } catch (error) {
    return { ok: false as const, error: safeError(error, "Plaid account connected, but initial finance sync failed.") };
  }
}

export async function syncPlaidAction(connectionId?: string) {
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return { ok: false as const, error: "Not signed in." };

  try {
    const ids = connectionId
      ? [UUID_Z.parse(connectionId)]
      : (await listPlaidConnections(user.id)).filter((connection) => connection.status === "active").map((connection) => connection.id);
    if (ids.length === 0) return { ok: false as const, error: "No active Plaid connections to sync." };

    const summaries = [];
    for (const id of ids) summaries.push(await syncPlaidConnectionForUser(user.id, supabase, id));
    revalidateFinance();
    return { ok: true as const, data: { connections: summaries.length, summaries } };
  } catch (error) {
    return { ok: false as const, error: safeError(error, "Plaid finance sync failed.") };
  }
}

export async function disconnectPlaidAction(connectionId: string) {
  const parsed = UUID_Z.safeParse(connectionId);
  if (!parsed.success) return { ok: false as const, error: "Invalid Plaid connection." };
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };

  try {
    const connection = await getPlaidConnectionSecret(user.id, parsed.data);
    if (!connection) return { ok: false as const, error: "Plaid connection not found." };
    await removePlaidItem(connection.accessToken);
    await deletePlaidConnection(user.id, parsed.data);
    revalidateFinance();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: safeError(error, "Could not disconnect Plaid.") };
  }
}

export async function deletePlaidImportedDataAction() {
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return { ok: false as const, error: "Not signed in." };
  try {
    const tx = await supabase.from("finance_transactions").delete().eq("user_id", user.id).eq("provider", "plaid");
    if (tx.error) throw tx.error;
    const liabilities = await supabase.from("finance_liabilities").delete().eq("user_id", user.id).eq("provider", "plaid");
    if (liabilities.error) throw liabilities.error;
    const accounts = await supabase.from("finance_accounts").delete().eq("user_id", user.id).eq("provider", "plaid");
    if (accounts.error) throw accounts.error;

    await persistFinanceImport(user.id, supabase, {
      provider: "plaid",
      generatedAt: new Date().toISOString(),
      accounts: [],
      transactions: [],
      liabilities: [],
    });
    revalidateFinance();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: safeError(error, "Plaid data could not be deleted.") };
  }
}

export async function connectSimpleFinAction(rawToken: unknown) {
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return { ok: false as const, error: "Not signed in." };
  const parsed = z.string().trim().min(20).max(5000).safeParse(rawToken);
  if (!parsed.success) return { ok: false as const, error: "Paste a valid SimpleFIN setup token." };

  try {
    const accessUrl = await claimSimpleFinSetupToken(parsed.data);
    await setSimpleFinAccessUrl(accessUrl);
    const imported = await fetchSimpleFinImport(accessUrl);
    const summary = await persistFinanceImport(user.id, supabase, imported);
    revalidateFinance();
    return { ok: true as const, data: summary };
  } catch (error) {
    return { ok: false as const, error: safeError(error, "Could not connect SimpleFIN.") };
  }
}

export async function syncFinanceAction() {
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return { ok: false as const, error: "Not signed in." };
  try {
    const accessUrl = await getSimpleFinAccessUrl();
    if (!accessUrl) return { ok: false as const, error: "SimpleFIN is not connected." };
    const imported = await fetchSimpleFinImport(accessUrl);
    const summary = await persistFinanceImport(user.id, supabase, imported);
    revalidateFinance();
    return { ok: true as const, data: summary };
  } catch (error) {
    return { ok: false as const, error: safeError(error, "Finance sync failed.") };
  }
}

export async function disconnectSimpleFinAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  try {
    await clearSimpleFinAccessUrl();
    revalidateFinance();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: safeError(error, "Could not disconnect SimpleFIN.") };
  }
}

export async function importFinanceJsonAction(rawJson: unknown) {
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return { ok: false as const, error: "Not signed in." };
  if (typeof rawJson !== "string" || rawJson.length > 2_000_000) {
    return { ok: false as const, error: "Finance import must be JSON under 2 MB." };
  }
  try {
    const value = JSON.parse(rawJson) as unknown;
    const parsed = financeImportSchema.safeParse(value);
    if (!parsed.success) return { ok: false as const, error: "Finance JSON does not match the Year Mission normalized import format." };
    const summary = await persistFinanceImport(user.id, supabase, parsed.data);
    revalidateFinance();
    return { ok: true as const, data: summary };
  } catch (error) {
    return { ok: false as const, error: safeError(error, "Finance JSON could not be imported.") };
  }
}

export async function saveManualLiabilityAction(rawInput: unknown) {
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return { ok: false as const, error: "Not signed in." };
  const parsed = financeLiabilitySchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false as const, error: "Enter a valid liability balance and details." };
  try {
    await upsertManualLiability(user.id, supabase, parsed.data);
    revalidateFinance();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: safeError(error, "Liability could not be saved.") };
  }
}
