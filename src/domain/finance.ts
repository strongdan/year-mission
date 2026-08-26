import { z } from "zod";

export const financeProviderSchema = z.enum(["actual", "simplefin", "manual", "import"]);
export type FinanceProvider = z.infer<typeof financeProviderSchema>;

export const financeAccountSchema = z.object({
  providerAccountId: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  institutionName: z.string().max(200).nullable().optional(),
  accountType: z.enum(["checking", "savings", "credit", "loan", "investment", "cash", "other"]),
  balance: z.number().finite().nullable().optional(),
  availableBalance: z.number().finite().nullable().optional(),
  currency: z.string().length(3).default("USD"),
  active: z.boolean().default(true),
});

export const financeTransactionSchema = z.object({
  providerTransactionId: z.string().min(1).max(300),
  providerAccountId: z.string().min(1).max(200),
  postedDate: z.iso.date(),
  amount: z.number().finite(),
  payee: z.string().max(300).nullable().optional(),
  category: z.string().max(200).nullable().optional(),
  pending: z.boolean().default(false),
  notes: z.string().max(1000).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const financeLiabilitySchema = z.object({
  providerLiabilityId: z.string().min(1).max(300),
  providerAccountId: z.string().min(1).max(200).nullable().optional(),
  name: z.string().min(1).max(200),
  liabilityType: z.enum(["credit_card", "student_loan", "mortgage", "auto", "personal", "other"]),
  balance: z.number().finite().nonnegative(),
  apr: z.number().finite().min(0).max(100).nullable().optional(),
  minimumPayment: z.number().finite().nonnegative().nullable().optional(),
  dueDate: z.iso.date().nullable().optional(),
  accruedInterest: z.number().finite().nonnegative().nullable().optional(),
  currency: z.string().length(3).default("USD"),
  sourceUpdatedAt: z.iso.datetime().nullable().optional(),
});

export const financeImportSchema = z.object({
  provider: financeProviderSchema,
  generatedAt: z.iso.datetime(),
  accounts: z.array(financeAccountSchema).max(100),
  transactions: z.array(financeTransactionSchema).max(5000).default([]),
  liabilities: z.array(financeLiabilitySchema).max(200).default([]),
});

export type FinanceImport = z.infer<typeof financeImportSchema>;
export type FinanceAccountInput = z.infer<typeof financeAccountSchema>;
export type FinanceTransactionInput = z.infer<typeof financeTransactionSchema>;
export type FinanceLiabilityInput = z.infer<typeof financeLiabilitySchema>;

export interface FinanceSummaryInput {
  accounts: Array<{ accountType: string; balance: number | null }>;
  liabilities: Array<{ liabilityType: string; balance: number }>;
  transactions: Array<{ amount: number; postedDate: string; pending: boolean }>;
}

export interface FinanceSummary {
  cash: number;
  creditCardDebt: number;
  studentLoanDebt: number;
  otherDebt: number;
  totalDebt: number;
  netPosition: number;
  trailing30DayOutflow: number;
}

export function summarizeFinance(input: FinanceSummaryInput, today = new Date()): FinanceSummary {
  const cashTypes = new Set(["checking", "savings", "cash"]);
  const cash = input.accounts.reduce((sum, account) => {
    if (!cashTypes.has(account.accountType) || account.balance == null) return sum;
    return sum + account.balance;
  }, 0);

  let creditCardDebt = 0;
  let studentLoanDebt = 0;
  let otherDebt = 0;
  for (const liability of input.liabilities) {
    if (liability.liabilityType === "credit_card") creditCardDebt += liability.balance;
    else if (liability.liabilityType === "student_loan") studentLoanDebt += liability.balance;
    else otherDebt += liability.balance;
  }

  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffDate = cutoff.toISOString().slice(0, 10);
  const trailing30DayOutflow = input.transactions.reduce((sum, transaction) => {
    if (transaction.pending || transaction.postedDate < cutoffDate) return sum;
    return transaction.amount < 0 ? sum + Math.abs(transaction.amount) : sum;
  }, 0);

  const totalDebt = creditCardDebt + studentLoanDebt + otherDebt;
  return {
    cash,
    creditCardDebt,
    studentLoanDebt,
    otherDebt,
    totalDebt,
    netPosition: cash - totalDebt,
    trailing30DayOutflow,
  };
}
