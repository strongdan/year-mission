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
  getFinanceDashboard,
  persistFinanceImport,
  upsertManualLiability,
} from "@/services/finance/finance-service";

function revalidateFinance() {
  for (const path of ["/money", "/progress", "/settings", "/coach"]) revalidatePath(path);
}

function safeError(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message.slice(0, 300);
  return fallback;
}

export async function getFinanceStatusAction() {
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return { ok: false as const, error: "Not signed in." };
  try {
    const [simplefin, dashboard] = await Promise.all([
      getSimpleFinConnectionStatus(),
      getFinanceDashboard(user.id, supabase),
    ]);
    return { ok: true as const, data: { simplefin, dashboard } };
  } catch (error) {
    return { ok: false as const, error: safeError(error, "Finance status could not be loaded.") };
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
