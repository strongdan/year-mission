import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { financeImportSchema, summarizeFinance, type FinanceImport, type FinanceLiabilityInput } from "@/domain/finance";

type Db = SupabaseClient;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function inferredLiabilityType(account: { name: string; accountType: string }): "credit_card" | "student_loan" | "mortgage" | "auto" | "personal" | "other" | null {
  const name = account.name.toLowerCase();
  if (account.accountType === "credit") return "credit_card";
  if (account.accountType !== "loan") return null;
  if (/student|nelnet|mohela|aidvantage|edfinancial|navient/.test(name)) return "student_loan";
  if (/mortgage|home loan/.test(name)) return "mortgage";
  if (/auto|vehicle|car loan/.test(name)) return "auto";
  return "other";
}

function positiveDebtBalance(balance: number | null | undefined): number {
  if (balance == null || !Number.isFinite(balance)) return 0;
  return Math.abs(balance);
}

export async function persistFinanceImport(userId: string, client: Db, rawImport: FinanceImport) {
  const data = financeImportSchema.parse(rawImport);
  const syncedAt = new Date().toISOString();

  if (data.accounts.length > 0) {
    const rows = data.accounts.map((account) => ({
      user_id: userId,
      provider: data.provider,
      provider_account_id: account.providerAccountId,
      name: account.name,
      institution_name: account.institutionName ?? null,
      account_type: account.accountType,
      balance: account.balance ?? null,
      available_balance: account.availableBalance ?? null,
      currency: account.currency,
      active: account.active,
      last_synced_at: syncedAt,
      updated_at: syncedAt,
    }));
    const { error } = await client.from("finance_accounts").upsert(rows, {
      onConflict: "user_id,provider,provider_account_id",
    });
    if (error) throw error;
  }

  const { data: storedAccounts, error: accountError } = await client
    .from("finance_accounts")
    .select("id,provider_account_id,account_type,name,balance")
    .eq("user_id", userId)
    .eq("provider", data.provider);
  if (accountError) throw accountError;
  const accountByProviderId = new Map((storedAccounts ?? []).map((account) => [account.provider_account_id as string, account]));

  if (data.transactions.length > 0) {
    const rows = data.transactions.flatMap((transaction) => {
      const account = accountByProviderId.get(transaction.providerAccountId);
      if (!account) return [];
      return [{
        user_id: userId,
        finance_account_id: account.id,
        provider: data.provider,
        provider_transaction_id: transaction.providerTransactionId,
        posted_date: transaction.postedDate,
        amount: transaction.amount,
        payee: transaction.payee ?? null,
        category: transaction.category ?? null,
        pending: transaction.pending,
        notes: transaction.notes ?? null,
        metadata: transaction.metadata,
        updated_at: syncedAt,
      }];
    });
    if (rows.length > 0) {
      const { error } = await client.from("finance_transactions").upsert(rows, {
        onConflict: "user_id,provider,provider_transaction_id",
      });
      if (error) throw error;
    }
  }

  const explicitLiabilities = data.liabilities.map((liability) => ({ ...liability, _derived: false }));
  const explicitAccountIds = new Set(data.liabilities.map((liability) => liability.providerAccountId).filter(Boolean));
  const derivedLiabilities = data.accounts.flatMap((account) => {
    if (explicitAccountIds.has(account.providerAccountId)) return [];
    const liabilityType = inferredLiabilityType(account);
    if (!liabilityType) return [];
    return [{
      providerLiabilityId: `account:${account.providerAccountId}`,
      providerAccountId: account.providerAccountId,
      name: account.name,
      liabilityType,
      balance: positiveDebtBalance(account.balance),
      apr: null,
      minimumPayment: null,
      dueDate: null,
      accruedInterest: null,
      currency: account.currency,
      sourceUpdatedAt: data.generatedAt,
      _derived: true,
    }];
  });

  const allLiabilities = [...explicitLiabilities, ...derivedLiabilities];
  if (allLiabilities.length > 0) {
    const rows = allLiabilities.map((liability) => ({
      user_id: userId,
      finance_account_id: liability.providerAccountId ? accountByProviderId.get(liability.providerAccountId)?.id ?? null : null,
      provider: data.provider,
      provider_liability_id: liability.providerLiabilityId,
      name: liability.name,
      liability_type: liability.liabilityType,
      balance: liability.balance,
      apr: liability.apr ?? null,
      minimum_payment: liability.minimumPayment ?? null,
      due_date: liability.dueDate ?? null,
      accrued_interest: liability.accruedInterest ?? null,
      currency: liability.currency,
      source_updated_at: liability.sourceUpdatedAt ?? data.generatedAt,
      last_synced_at: syncedAt,
      updated_at: syncedAt,
    }));
    const { error } = await client.from("finance_liabilities").upsert(rows, {
      onConflict: "user_id,provider,provider_liability_id",
    });
    if (error) throw error;
  }

  const dashboard = await getFinanceDashboard(userId, client);
  const consumerDebt = dashboard.liabilities
    .filter((liability) => ["credit_card", "auto", "personal", "other"].includes(liability.liabilityType))
    .reduce((sum, liability) => sum + liability.balance, 0);

  const { error: snapshotError } = await client.from("financial_snapshots").upsert({
    user_id: userId,
    date: todayIso(),
    consumer_debt: consumerDebt,
    cash_reserve: dashboard.summary.cash,
    notes: `Auto-updated from ${data.provider} finance sync.`,
  }, { onConflict: "user_id,date" });
  if (snapshotError) throw snapshotError;

  return {
    accounts: data.accounts.length,
    transactions: data.transactions.length,
    liabilities: allLiabilities.length,
    summary: dashboard.summary,
  };
}

export async function upsertManualLiability(userId: string, client: Db, liability: FinanceLiabilityInput) {
  const now = new Date().toISOString();
  const { error } = await client.from("finance_liabilities").upsert({
    user_id: userId,
    finance_account_id: null,
    provider: "manual",
    provider_liability_id: liability.providerLiabilityId,
    name: liability.name,
    liability_type: liability.liabilityType,
    balance: liability.balance,
    apr: liability.apr ?? null,
    minimum_payment: liability.minimumPayment ?? null,
    due_date: liability.dueDate ?? null,
    accrued_interest: liability.accruedInterest ?? null,
    currency: liability.currency,
    source_updated_at: liability.sourceUpdatedAt ?? now,
    last_synced_at: now,
    updated_at: now,
  }, { onConflict: "user_id,provider,provider_liability_id" });
  if (error) throw error;
}

export async function getFinanceDashboard(userId: string, client: Db) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 31);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  const [accountsResult, liabilitiesResult, transactionsResult] = await Promise.all([
    client.from("finance_accounts").select("id,name,institution_name,account_type,balance,available_balance,currency,provider,last_synced_at").eq("user_id", userId).eq("active", true).order("name"),
    client.from("finance_liabilities").select("id,name,liability_type,balance,apr,minimum_payment,due_date,currency,provider,last_synced_at").eq("user_id", userId).order("balance", { ascending: false }),
    client.from("finance_transactions").select("amount,posted_date,pending").eq("user_id", userId).gte("posted_date", cutoffDate),
  ]);
  if (accountsResult.error) throw accountsResult.error;
  if (liabilitiesResult.error) throw liabilitiesResult.error;
  if (transactionsResult.error) throw transactionsResult.error;

  const accounts = (accountsResult.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    institutionName: (row.institution_name as string | null) ?? null,
    accountType: row.account_type as string,
    balance: row.balance == null ? null : Number(row.balance),
    availableBalance: row.available_balance == null ? null : Number(row.available_balance),
    currency: row.currency as string,
    provider: row.provider as string,
    lastSyncedAt: (row.last_synced_at as string | null) ?? null,
  }));
  const liabilities = (liabilitiesResult.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    liabilityType: row.liability_type as string,
    balance: Number(row.balance),
    apr: row.apr == null ? null : Number(row.apr),
    minimumPayment: row.minimum_payment == null ? null : Number(row.minimum_payment),
    dueDate: (row.due_date as string | null) ?? null,
    currency: row.currency as string,
    provider: row.provider as string,
    lastSyncedAt: row.last_synced_at as string,
  }));
  const transactions = (transactionsResult.data ?? []).map((row) => ({
    amount: Number(row.amount),
    postedDate: row.posted_date as string,
    pending: Boolean(row.pending),
  }));

  return {
    accounts,
    liabilities,
    summary: summarizeFinance({ accounts, liabilities, transactions }),
  };
}
