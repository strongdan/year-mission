import Link from "next/link";
import { ArrowUpRight, CircleDollarSign, CreditCard, Landmark, WalletCards } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";

interface MoneyOverviewProps {
  dashboard: {
    summary: {
      cash: number;
      creditCardDebt: number;
      studentLoanDebt: number;
      otherDebt: number;
      totalDebt: number;
      netPosition: number;
      trailing30DayOutflow: number;
    };
    accounts: Array<{
      id: string;
      name: string;
      institutionName: string | null;
      accountType: string;
      balance: number | null;
      provider: string;
      lastSyncedAt: string | null;
    }>;
    liabilities: Array<{
      id: string;
      name: string;
      liabilityType: string;
      balance: number;
      apr: number | null;
      minimumPayment: number | null;
      dueDate: string | null;
      provider: string;
      lastSyncedAt: string;
    }>;
  };
}

function money(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function labelType(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function MoneyOverview({ dashboard }: MoneyOverviewProps) {
  const { summary, accounts, liabilities } = dashboard;

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">Year Mission</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Money</h1>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">A small read-only picture of what needs attention, not another budgeting app.</p>
        </div>
        <Link href="/settings" className="mt-1 inline-flex items-center gap-1 rounded-full border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-100">
          Manage <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <Card className="border-emerald-950/60 bg-emerald-950/10">
        <CardHeader title="Financial position" subtitle="Synced balances plus manually tracked liabilities." right={<CircleDollarSign className="h-4 w-4 text-emerald-400" />} />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3"><p className="text-[11px] text-zinc-500">Cash</p><p className="mt-1 text-xl font-semibold text-zinc-100">{money(summary.cash)}</p></div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3"><p className="text-[11px] text-zinc-500">Total debt</p><p className="mt-1 text-xl font-semibold text-zinc-100">{money(summary.totalDebt)}</p></div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3"><p className="text-[11px] text-zinc-500">30-day outflow</p><p className="mt-1 text-lg font-semibold text-zinc-200">{money(summary.trailing30DayOutflow)}</p></div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3"><p className="text-[11px] text-zinc-500">Cash minus debt</p><p className="mt-1 text-lg font-semibold text-zinc-200">{money(summary.netPosition)}</p></div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Debt" subtitle="Enough detail to know what deserves action." right={<CreditCard className="h-4 w-4 text-amber-400" />} />
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-zinc-950/40 p-2"><p className="text-[10px] text-zinc-600">Cards</p><p className="mt-1 text-xs font-semibold text-zinc-300">{money(summary.creditCardDebt)}</p></div>
          <div className="rounded-lg bg-zinc-950/40 p-2"><p className="text-[10px] text-zinc-600">Student</p><p className="mt-1 text-xs font-semibold text-zinc-300">{money(summary.studentLoanDebt)}</p></div>
          <div className="rounded-lg bg-zinc-950/40 p-2"><p className="text-[10px] text-zinc-600">Other</p><p className="mt-1 text-xs font-semibold text-zinc-300">{money(summary.otherDebt)}</p></div>
        </div>
        {liabilities.length > 0 ? (
          <div className="mt-3 divide-y divide-zinc-800/80">
            {liabilities.map((liability) => (
              <div key={liability.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0"><p className="truncate text-sm font-medium text-zinc-200">{liability.name}</p><p className="mt-0.5 text-[11px] text-zinc-600">{labelType(liability.liabilityType)} · {liability.provider}{liability.apr != null ? ` · ${liability.apr}% APR` : ""}</p></div>
                <div className="shrink-0 text-right"><p className="text-sm font-semibold text-zinc-200">{money(liability.balance)}</p><p className="mt-0.5 text-[10px] text-zinc-600">{liability.minimumPayment != null ? `${money(liability.minimumPayment)} min` : ""}{liability.dueDate ? `${liability.minimumPayment != null ? " · " : ""}${formatDate(liability.dueDate)}` : ""}</p></div>
              </div>
            ))}
          </div>
        ) : <p className="mt-3 text-xs text-zinc-600">No liabilities tracked yet.</p>}
      </Card>

      <Card>
        <CardHeader title="Accounts" subtitle="Balances from connected/imported sources." right={<Landmark className="h-4 w-4 text-sky-400" />} />
        {accounts.length > 0 ? (
          <div className="divide-y divide-zinc-800/80">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0"><p className="truncate text-sm text-zinc-200">{account.name}</p><p className="mt-0.5 text-[11px] text-zinc-600">{account.institutionName ?? labelType(account.accountType)} · {account.provider}</p></div>
                <p className="shrink-0 text-sm font-semibold text-zinc-300">{account.balance == null ? "—" : money(account.balance)}</p>
              </div>
            ))}
          </div>
        ) : <div className="flex items-start gap-2 text-xs text-zinc-600"><WalletCards className="mt-0.5 h-4 w-4 shrink-0" />Connect SimpleFIN, import Actual data, or add a manual liability in Settings.</div>}
      </Card>
    </div>
  );
}
