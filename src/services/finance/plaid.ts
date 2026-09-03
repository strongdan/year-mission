import "server-only";

import { financeImportSchema, type FinanceImport, type FinanceLiabilityInput } from "@/domain/finance";

export type PlaidEnvironment = "sandbox" | "production";

interface PlaidConfig {
  clientId: string;
  secret: string;
  environment: PlaidEnvironment;
  redirectUri: string | null;
  webhookUrl: string | null;
}

interface PlaidErrorBody {
  error_code?: string;
  error_message?: string;
  error_type?: string;
}

export class PlaidApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly type: string | null;

  constructor(status: number, body: PlaidErrorBody) {
    super((body.error_message || body.error_code || `Plaid request failed (${status}).`).slice(0, 300));
    this.name = "PlaidApiError";
    this.status = status;
    this.code = body.error_code ?? null;
    this.type = body.error_type ?? null;
  }
}

function config(): PlaidConfig {
  const clientId = process.env.PLAID_CLIENT_ID?.trim() ?? "";
  const secret = process.env.PLAID_SECRET?.trim() ?? "";
  const environment = process.env.PLAID_ENVIRONMENT === "production" ? "production" : "sandbox";
  const redirectUri = process.env.PLAID_REDIRECT_URI?.trim() || null;
  const webhookUrl = process.env.PLAID_WEBHOOK_URL?.trim() || null;
  if (!clientId || !secret) throw new Error("Plaid is not configured. Set PLAID_CLIENT_ID and PLAID_SECRET.");
  return { clientId, secret, environment, redirectUri, webhookUrl };
}

export function getPlaidConfigurationStatus(): { configured: boolean; environment: PlaidEnvironment } {
  return {
    configured: Boolean(process.env.PLAID_CLIENT_ID?.trim() && process.env.PLAID_SECRET?.trim()),
    environment: process.env.PLAID_ENVIRONMENT === "production" ? "production" : "sandbox",
  };
}

function baseUrl(environment: PlaidEnvironment): string {
  return environment === "production" ? "https://production.plaid.com" : "https://sandbox.plaid.com";
}

async function plaidPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const current = config();
  const response = await fetch(`${baseUrl(current.environment)}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "PLAID-CLIENT-ID": current.clientId,
      "PLAID-SECRET": current.secret,
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  const payload = (await response.json().catch(() => ({}))) as T & PlaidErrorBody;
  if (!response.ok) throw new PlaidApiError(response.status, payload);
  return payload;
}

export async function createPlaidLinkToken(userId: string): Promise<string> {
  const current = config();
  const payload: Record<string, unknown> = {
    user: { client_user_id: userId },
    client_name: "Year Mission",
    products: ["transactions"],
    additional_consented_products: ["liabilities"],
    country_codes: ["US"],
    language: "en",
  };
  if (current.redirectUri) payload.redirect_uri = current.redirectUri;
  if (current.webhookUrl) payload.webhook = current.webhookUrl;

  const result = await plaidPost<{ link_token?: string }>("/link/token/create", payload);
  if (!result.link_token) throw new Error("Plaid returned no Link token.");
  return result.link_token;
}

export async function createPlaidUpdateLinkToken(userId: string, accessToken: string): Promise<string> {
  const current = config();
  const payload: Record<string, unknown> = {
    user: { client_user_id: userId },
    client_name: "Year Mission",
    access_token: accessToken,
    country_codes: ["US"],
    language: "en",
  };
  if (current.redirectUri) payload.redirect_uri = current.redirectUri;
  if (current.webhookUrl) payload.webhook = current.webhookUrl;
  const result = await plaidPost<{ link_token?: string }>("/link/token/create", payload);
  if (!result.link_token) throw new Error("Plaid returned no update token.");
  return result.link_token;
}

export async function exchangePlaidPublicToken(publicToken: string): Promise<{ accessToken: string; itemId: string }> {
  const result = await plaidPost<{ access_token?: string; item_id?: string }>("/item/public_token/exchange", {
    public_token: publicToken,
  });
  if (!result.access_token || !result.item_id) throw new Error("Plaid token exchange returned incomplete credentials.");
  return { accessToken: result.access_token, itemId: result.item_id };
}

export async function removePlaidItem(accessToken: string): Promise<void> {
  await plaidPost("/item/remove", { access_token: accessToken });
}

interface PlaidAccount {
  account_id: string;
  name: string;
  official_name?: string | null;
  type: string;
  subtype?: string | null;
  balances: {
    current?: number | null;
    available?: number | null;
    iso_currency_code?: string | null;
  };
}

function accountType(account: PlaidAccount): "checking" | "savings" | "credit" | "loan" | "investment" | "cash" | "other" {
  if (account.type === "credit") return "credit";
  if (account.type === "loan") return "loan";
  if (account.type === "investment") return "investment";
  if (account.type === "depository" && account.subtype === "checking") return "checking";
  if (account.type === "depository" && (account.subtype === "savings" || account.subtype === "money market")) return "savings";
  if (account.type === "depository") return "checking";
  return "other";
}

interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  date: string;
  amount: number;
  name?: string | null;
  merchant_name?: string | null;
  pending?: boolean;
  iso_currency_code?: string | null;
  personal_finance_category?: { primary?: string | null; detailed?: string | null } | null;
  category?: string[] | null;
}

interface PlaidRemovedTransaction { transaction_id: string }

interface TransactionsSyncResponse {
  added?: PlaidTransaction[];
  modified?: PlaidTransaction[];
  removed?: PlaidRemovedTransaction[];
  next_cursor?: string;
  has_more?: boolean;
}

export interface PlaidTransactionDelta {
  transactions: PlaidTransaction[];
  removedIds: string[];
  nextCursor: string;
}

export async function fetchPlaidTransactionDelta(accessToken: string, cursor: string | null): Promise<PlaidTransactionDelta> {
  const startingCursor = cursor || null;

  for (let restart = 0; restart < 2; restart += 1) {
    let nextCursor = startingCursor;
    const changed = new Map<string, PlaidTransaction>();
    const removed = new Set<string>();

    try {
      for (let page = 0; page < 20; page += 1) {
        const body: Record<string, unknown> = { access_token: accessToken, count: 500 };
        if (nextCursor) body.cursor = nextCursor;
        const response = await plaidPost<TransactionsSyncResponse>("/transactions/sync", body);

        for (const transaction of [...(response.added ?? []), ...(response.modified ?? [])]) {
          changed.set(transaction.transaction_id, transaction);
          removed.delete(transaction.transaction_id);
        }
        for (const transaction of response.removed ?? []) {
          removed.add(transaction.transaction_id);
          changed.delete(transaction.transaction_id);
        }

        nextCursor = response.next_cursor ?? nextCursor;
        if (!response.has_more) {
          return { transactions: [...changed.values()], removedIds: [...removed], nextCursor: nextCursor ?? "" };
        }
      }
      throw new Error("Plaid transaction sync exceeded the pagination safety limit.");
    } catch (error) {
      if (error instanceof PlaidApiError && error.code === "TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION" && restart === 0) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Plaid transaction sync could not stabilize.");
}

interface PlaidCreditLiability {
  account_id: string;
  minimum_payment_amount?: number | null;
  next_payment_due_date?: string | null;
  aprs?: Array<{ apr_percentage?: number | null; apr_type?: string | null }>;
}
interface PlaidMortgageLiability {
  account_id: string;
  next_monthly_payment?: number | null;
  next_payment_due_date?: string | null;
  outstanding_principal_balance?: number | null;
  interest_rate?: { percentage?: number | null } | null;
}
interface PlaidStudentLiability {
  account_id: string;
  minimum_payment_amount?: number | null;
  next_payment_due_date?: string | null;
  outstanding_interest_amount?: number | null;
  interest_rate_percentage?: number | null;
}

interface LiabilitiesResponse {
  accounts?: PlaidAccount[];
  liabilities?: {
    credit?: PlaidCreditLiability[] | null;
    mortgage?: PlaidMortgageLiability[] | null;
    student?: PlaidStudentLiability[] | null;
  };
}

function preferredCreditApr(item: PlaidCreditLiability): number | null {
  const apr = item.aprs?.find((candidate) => candidate.apr_type === "purchase_apr") ?? item.aprs?.[0];
  return apr?.apr_percentage ?? null;
}

function liabilityInputs(response: LiabilitiesResponse): FinanceLiabilityInput[] {
  const accounts = new Map((response.accounts ?? []).map((account) => [account.account_id, account]));
  const accountBalance = (accountId: string, fallback?: number | null) => {
    const current = accounts.get(accountId)?.balances.current;
    return Math.max(0, Math.abs(current ?? fallback ?? 0));
  };
  const accountName = (accountId: string) => accounts.get(accountId)?.official_name || accounts.get(accountId)?.name || "Plaid liability";
  const currency = (accountId: string) => accounts.get(accountId)?.balances.iso_currency_code || "USD";

  const credit = (response.liabilities?.credit ?? []).map((item): FinanceLiabilityInput => ({
    providerLiabilityId: `${item.account_id}:credit`,
    providerAccountId: item.account_id,
    name: accountName(item.account_id),
    liabilityType: "credit_card",
    balance: accountBalance(item.account_id),
    apr: preferredCreditApr(item),
    minimumPayment: item.minimum_payment_amount ?? null,
    dueDate: item.next_payment_due_date ?? null,
    accruedInterest: null,
    currency: currency(item.account_id),
    sourceUpdatedAt: new Date().toISOString(),
  }));

  const mortgage = (response.liabilities?.mortgage ?? []).map((item): FinanceLiabilityInput => ({
    providerLiabilityId: `${item.account_id}:mortgage`,
    providerAccountId: item.account_id,
    name: accountName(item.account_id),
    liabilityType: "mortgage",
    balance: accountBalance(item.account_id, item.outstanding_principal_balance),
    apr: item.interest_rate?.percentage ?? null,
    minimumPayment: item.next_monthly_payment ?? null,
    dueDate: item.next_payment_due_date ?? null,
    accruedInterest: null,
    currency: currency(item.account_id),
    sourceUpdatedAt: new Date().toISOString(),
  }));

  const student = (response.liabilities?.student ?? []).map((item): FinanceLiabilityInput => ({
    providerLiabilityId: `${item.account_id}:student`,
    providerAccountId: item.account_id,
    name: accountName(item.account_id),
    liabilityType: "student_loan",
    balance: accountBalance(item.account_id),
    apr: item.interest_rate_percentage ?? null,
    minimumPayment: item.minimum_payment_amount ?? null,
    dueDate: item.next_payment_due_date ?? null,
    accruedInterest: item.outstanding_interest_amount ?? null,
    currency: currency(item.account_id),
    sourceUpdatedAt: new Date().toISOString(),
  }));

  return [...credit, ...mortgage, ...student];
}

async function fetchPlaidLiabilities(accessToken: string): Promise<LiabilitiesResponse | null> {
  try {
    return await plaidPost<LiabilitiesResponse>("/liabilities/get", { access_token: accessToken });
  } catch (error) {
    if (error instanceof PlaidApiError && ["PRODUCT_NOT_READY", "PRODUCT_NOT_ENABLED", "NO_LIABILITY_ACCOUNTS"].includes(error.code ?? "")) {
      return null;
    }
    throw error;
  }
}

export interface PlaidImportResult {
  importData: FinanceImport;
  removedTransactionIds: string[];
  nextCursor: string;
}

export async function fetchPlaidImport(
  accessToken: string,
  institutionName: string | null,
  cursor: string | null
): Promise<PlaidImportResult> {
  const [accountsResponse, delta, liabilitiesResponse] = await Promise.all([
    plaidPost<{ accounts?: PlaidAccount[] }>("/accounts/get", { access_token: accessToken }),
    fetchPlaidTransactionDelta(accessToken, cursor),
    fetchPlaidLiabilities(accessToken),
  ]);

  const accounts = accountsResponse.accounts ?? [];
  const normalized: FinanceImport = {
    provider: "plaid",
    generatedAt: new Date().toISOString(),
    accounts: accounts.map((account) => ({
      providerAccountId: account.account_id,
      name: account.official_name || account.name,
      institutionName,
      accountType: accountType(account),
      balance: account.balances.current ?? null,
      availableBalance: account.balances.available ?? null,
      currency: account.balances.iso_currency_code || "USD",
      active: true,
    })),
    transactions: delta.transactions.map((transaction) => ({
      providerTransactionId: transaction.transaction_id,
      providerAccountId: transaction.account_id,
      postedDate: transaction.date,
      // Plaid uses positive amounts for money leaving an account; Year Mission uses negative outflows.
      amount: -transaction.amount,
      payee: transaction.merchant_name || transaction.name || null,
      category: transaction.personal_finance_category?.primary || transaction.category?.[0] || null,
      pending: Boolean(transaction.pending),
      notes: null,
      metadata: {
        plaidDetailedCategory: transaction.personal_finance_category?.detailed ?? null,
        plaidCurrency: transaction.iso_currency_code ?? null,
      },
    })),
    liabilities: liabilitiesResponse ? liabilityInputs(liabilitiesResponse) : [],
  };

  return {
    importData: financeImportSchema.parse(normalized),
    removedTransactionIds: delta.removedIds,
    nextCursor: delta.nextCursor,
  };
}

export function plaidNeedsReconnect(error: unknown): boolean {
  return error instanceof PlaidApiError && [
    "ITEM_LOGIN_REQUIRED",
    "ITEM_LOCKED",
    "USER_PERMISSION_REVOKED",
    "USER_ACCOUNT_REVOKED",
    "PENDING_DISCONNECT",
  ].includes(error.code ?? "");
}
