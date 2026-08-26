#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const endpoint = process.env.YEAR_MISSION_FINANCE_IMPORT_URL ?? "https://year-mission.vercel.app/api/finance/import";
const token = process.env.YEAR_MISSION_FINANCE_SYNC_TOKEN ?? "";
const actualBin = process.env.ACTUAL_CLI_BIN ?? "actual";
const lookbackDays = Math.max(7, Math.min(Number(process.env.ACTUAL_FINANCE_LOOKBACK_DAYS ?? "95") || 95, 365));

if (!token) {
  console.error("YEAR_MISSION_FINANCE_SYNC_TOKEN is required.");
  process.exit(1);
}

function actual(args) {
  const output = execFileSync(actualBin, [...args, "--format", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
    maxBuffer: 20 * 1024 * 1024,
  }).trim();
  if (!output) return null;
  return JSON.parse(output);
}

function dollars(cents) {
  if (cents == null || cents === "") return null;
  const value = Number(cents);
  return Number.isFinite(value) ? value / 100 : null;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function accountType(name) {
  const lower = String(name ?? "").toLowerCase();
  if (/credit|visa|mastercard|amex|card/.test(lower)) return "credit";
  if (/checking|chequing/.test(lower)) return "checking";
  if (/saving|money market/.test(lower)) return "savings";
  if (/student|loan|mortgage|auto loan|nelnet|mohela|aidvantage|edfinancial|navient/.test(lower)) return "loan";
  if (/broker|investment|401|ira|roth/.test(lower)) return "investment";
  if (/cash/.test(lower)) return "cash";
  return "other";
}

function balanceValue(raw) {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") return Number(raw);
  if (raw && typeof raw === "object") {
    for (const key of ["balance", "amount", "value"]) {
      if (raw[key] != null) return Number(raw[key]);
    }
  }
  return NaN;
}

function transactionPayee(transaction) {
  if (typeof transaction.payee_name === "string") return transaction.payee_name;
  if (typeof transaction.imported_payee === "string") return transaction.imported_payee;
  if (typeof transaction.payee === "string") return transaction.payee;
  if (transaction.payee && typeof transaction.payee.name === "string") return transaction.payee.name;
  return null;
}

const now = new Date();
const start = new Date(now);
start.setUTCDate(start.getUTCDate() - lookbackDays);
const startDate = isoDate(start);
const endDate = isoDate(now);

const listed = actual(["accounts", "list"]);
const actualAccounts = Array.isArray(listed) ? listed : [];

const accounts = [];
const transactions = [];

for (const account of actualAccounts) {
  if (!account?.id || !account?.name) continue;
  const rawBalance = actual(["accounts", "balance", String(account.id)]);
  const cents = balanceValue(rawBalance);
  accounts.push({
    providerAccountId: String(account.id),
    name: String(account.name),
    institutionName: null,
    accountType: accountType(account.name),
    balance: Number.isFinite(cents) ? dollars(cents) : null,
    availableBalance: null,
    currency: "USD",
    active: account.closed !== true,
  });

  const listedTransactions = actual([
    "transactions",
    "list",
    "--account",
    String(account.id),
    "--start",
    startDate,
    "--end",
    endDate,
  ]);

  for (const transaction of Array.isArray(listedTransactions) ? listedTransactions : []) {
    if (!transaction?.id || !transaction?.date || transaction.amount == null) continue;
    if (transaction.is_parent === true) continue;
    transactions.push({
      providerTransactionId: String(transaction.imported_id ?? transaction.id),
      providerAccountId: String(account.id),
      postedDate: String(transaction.date),
      amount: dollars(transaction.amount) ?? 0,
      payee: transactionPayee(transaction),
      category: typeof transaction.category_name === "string"
        ? transaction.category_name
        : transaction.category && typeof transaction.category.name === "string"
          ? transaction.category.name
          : null,
      pending: transaction.cleared === false,
      notes: typeof transaction.notes === "string" ? transaction.notes : null,
      metadata: {},
    });
  }
}

const payload = {
  provider: "actual",
  generatedAt: now.toISOString(),
  accounts,
  transactions,
  liabilities: [],
};

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(30_000),
});

if (!response.ok) {
  console.error(`Year Mission finance import failed (${response.status}).`);
  process.exit(1);
}

const result = await response.json();
console.log(`Finance sync complete: ${result.accounts ?? accounts.length} accounts, ${result.transactions ?? transactions.length} transactions, ${result.liabilities ?? 0} liabilities.`);
