import "server-only";

import { financeImportSchema, type FinanceImport } from "@/domain/finance";

interface SimpleFinTransaction {
  id: string;
  posted: number;
  amount: string;
  description?: string;
  payee?: string;
  pending?: boolean;
  extra?: Record<string, unknown>;
}

interface SimpleFinAccount {
  id: string;
  name: string;
  currency: string;
  balance: string;
  "available-balance"?: string;
  "balance-date"?: number;
  conn_id?: string;
  conn_name?: string;
  org?: { name?: string; domain?: string };
  transactions?: SimpleFinTransaction[];
}

interface SimpleFinAccountSet {
  errlist?: Array<{ code?: string; msg?: string }>;
  errors?: string[];
  accounts?: SimpleFinAccount[];
}

function sanitizeProviderMessage(value: unknown): string {
  if (typeof value !== "string") return "SimpleFIN returned an error.";
  return value.replace(/[\r\n\t]+/g, " ").slice(0, 240);
}

function decodeSetupToken(token: string): string {
  const normalized = token.trim();
  if (!normalized) throw new Error("SimpleFIN setup token is required.");
  const decoded = Buffer.from(normalized, "base64").toString("utf8");
  const url = new URL(decoded);
  if (url.protocol !== "https:") throw new Error("SimpleFIN claim URL must use HTTPS.");
  return url.toString();
}

export async function claimSimpleFinSetupToken(setupToken: string): Promise<string> {
  const claimUrl = decodeSetupToken(setupToken);
  const response = await fetch(claimUrl, {
    method: "POST",
    headers: { "content-length": "0" },
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 403) {
    throw new Error("SimpleFIN setup token was rejected or already claimed. Create a new setup token before trying again.");
  }
  if (!response.ok) throw new Error(`SimpleFIN connection failed (${response.status}).`);
  const accessUrl = (await response.text()).trim();
  const parsed = new URL(accessUrl);
  if (parsed.protocol !== "https:") throw new Error("SimpleFIN returned an insecure access URL.");
  if (!parsed.username || !parsed.password) throw new Error("SimpleFIN returned an access URL without credentials.");
  return parsed.toString().replace(/\/$/, "");
}

function inferAccountType(name: string): "checking" | "savings" | "credit" | "loan" | "investment" | "cash" | "other" {
  const lower = name.toLowerCase();
  if (/credit|visa|mastercard|amex|card/.test(lower)) return "credit";
  if (/checking|chequing/.test(lower)) return "checking";
  if (/saving|money market/.test(lower)) return "savings";
  if (/student|loan|mortgage|auto loan/.test(lower)) return "loan";
  if (/broker|investment|401|ira|roth/.test(lower)) return "investment";
  if (/cash/.test(lower)) return "cash";
  return "other";
}

function epochToDate(seconds: number): string {
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

function simpleFinRequest(accessUrl: string, days: number): { url: URL; authorization: string } {
  const base = new URL(accessUrl);
  if (base.protocol !== "https:") throw new Error("SimpleFIN access URL must use HTTPS.");
  if (!base.username || !base.password) throw new Error("Saved SimpleFIN credentials are incomplete.");

  const username = decodeURIComponent(base.username);
  const password = decodeURIComponent(base.password);
  base.username = "";
  base.password = "";

  const start = Math.floor(Date.now() / 1000) - Math.max(7, Math.min(days, 365)) * 86_400;
  const url = new URL(`${base.toString().replace(/\/$/, "")}/accounts`);
  url.searchParams.set("version", "2");
  url.searchParams.set("pending", "1");
  url.searchParams.set("start-date", String(start));
  return {
    url,
    authorization: `Basic ${Buffer.from(`${username}:${password}`, "utf8").toString("base64")}`,
  };
}

export async function fetchSimpleFinImport(accessUrl: string, days = 95): Promise<FinanceImport> {
  const request = simpleFinRequest(accessUrl, days);
  const response = await fetch(request.url, {
    method: "GET",
    headers: { authorization: request.authorization },
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  if (response.status === 402) throw new Error("SimpleFIN subscription/payment is required before syncing.");
  if (response.status === 403) throw new Error("SimpleFIN access was revoked or the saved credentials are no longer valid.");
  if (!response.ok) throw new Error(`SimpleFIN sync failed (${response.status}).`);

  const payload = (await response.json()) as SimpleFinAccountSet;
  const providerErrors = [
    ...(payload.errlist ?? []).map((item) => item.msg),
    ...(payload.errors ?? []),
  ].filter(Boolean);
  if (providerErrors.length > 0 && (payload.accounts?.length ?? 0) === 0) {
    throw new Error(sanitizeProviderMessage(providerErrors[0]));
  }

  const accounts = payload.accounts ?? [];
  const normalized: FinanceImport = {
    provider: "simplefin",
    generatedAt: new Date().toISOString(),
    accounts: accounts.map((account) => ({
      providerAccountId: account.id,
      name: account.name,
      institutionName: account.conn_name ?? account.org?.name ?? null,
      accountType: inferAccountType(account.name),
      balance: Number(account.balance),
      availableBalance: account["available-balance"] == null ? null : Number(account["available-balance"]),
      currency: account.currency || "USD",
      active: true,
    })),
    transactions: accounts.flatMap((account) => (account.transactions ?? []).map((transaction) => ({
      providerTransactionId: `${account.id}:${transaction.id}`,
      providerAccountId: account.id,
      postedDate: epochToDate(transaction.posted),
      amount: Number(transaction.amount),
      payee: transaction.payee ?? transaction.description ?? null,
      category: null,
      pending: Boolean(transaction.pending),
      notes: null,
      metadata: transaction.extra ?? {},
    }))),
    liabilities: [],
  };

  return financeImportSchema.parse(normalized);
}
