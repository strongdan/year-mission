import { describe, expect, it } from "vitest";
import { financeImportSchema, summarizeFinance } from "@/domain/finance";

describe("financeImportSchema", () => {
  it("accepts a normalized Actual/SimpleFIN payload", () => {
    const parsed = financeImportSchema.parse({
      provider: "actual",
      generatedAt: "2026-08-25T12:00:00.000Z",
      accounts: [{
        providerAccountId: "checking-1",
        name: "Checking",
        accountType: "checking",
        balance: 2400,
        currency: "USD",
      }],
      transactions: [{
        providerTransactionId: "tx-1",
        providerAccountId: "checking-1",
        postedDate: "2026-08-24",
        amount: -42.5,
        payee: "Groceries",
      }],
      liabilities: [{
        providerLiabilityId: "loan-1",
        name: "Student Loan",
        liabilityType: "student_loan",
        balance: 12000,
        apr: 4.5,
        currency: "USD",
      }],
    });

    expect(parsed.accounts).toHaveLength(1);
    expect(parsed.transactions[0].pending).toBe(false);
    expect(parsed.liabilities[0].balance).toBe(12000);
  });

  it("accepts Plaid as a normalized read-only provider", () => {
    const parsed = financeImportSchema.parse({
      provider: "plaid",
      generatedAt: "2026-09-02T20:00:00.000Z",
      accounts: [{
        providerAccountId: "plaid-checking",
        name: "Checking",
        institutionName: "Example Bank",
        accountType: "checking",
        balance: 1200,
        availableBalance: 1100,
        currency: "USD",
      }],
      transactions: [{
        providerTransactionId: "plaid-tx-1",
        providerAccountId: "plaid-checking",
        postedDate: "2026-09-01",
        amount: -25,
        payee: "Coffee",
        pending: false,
        metadata: { plaidDetailedCategory: "FOOD_AND_DRINK_COFFEE" },
      }],
      liabilities: [],
    });

    expect(parsed.provider).toBe("plaid");
    expect(parsed.transactions[0].amount).toBe(-25);
  });

  it("rejects insecure/invalid numeric liability data", () => {
    const result = financeImportSchema.safeParse({
      provider: "manual",
      generatedAt: "2026-08-25T12:00:00.000Z",
      accounts: [],
      liabilities: [{
        providerLiabilityId: "loan-1",
        name: "Bad Loan",
        liabilityType: "student_loan",
        balance: -1,
      }],
    });
    expect(result.success).toBe(false);
  });
});

describe("summarizeFinance", () => {
  it("separates cash, card debt, student loans, and 30-day outflow", () => {
    const summary = summarizeFinance({
      accounts: [
        { accountType: "checking", balance: 1500 },
        { accountType: "savings", balance: 3500 },
        { accountType: "credit", balance: -900 },
      ],
      liabilities: [
        { liabilityType: "credit_card", balance: 900 },
        { liabilityType: "student_loan", balance: 10000 },
        { liabilityType: "auto", balance: 5000 },
      ],
      transactions: [
        { amount: -100, postedDate: "2026-08-20", pending: false },
        { amount: 2000, postedDate: "2026-08-20", pending: false },
        { amount: -25, postedDate: "2026-08-21", pending: true },
        { amount: -500, postedDate: "2026-06-01", pending: false },
      ],
    }, new Date("2026-08-25T12:00:00.000Z"));

    expect(summary.cash).toBe(5000);
    expect(summary.creditCardDebt).toBe(900);
    expect(summary.studentLoanDebt).toBe(10000);
    expect(summary.otherDebt).toBe(5000);
    expect(summary.totalDebt).toBe(15900);
    expect(summary.netPosition).toBe(-10900);
    expect(summary.trailing30DayOutflow).toBe(100);
  });
});
