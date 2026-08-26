"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleDollarSign, RefreshCw, ShieldCheck } from "lucide-react";
import {
  connectSimpleFinAction,
  disconnectSimpleFinAction,
  getFinanceStatusAction,
  importFinanceJsonAction,
  saveManualLiabilityAction,
  syncFinanceAction,
} from "@/app/finance-actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

interface FinanceStatus {
  simplefin: { configured: boolean };
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
    accounts: Array<{ id: string; name: string; provider: string; lastSyncedAt: string | null }>;
    liabilities: Array<{ id: string; name: string; liabilityType: string; balance: number; provider: string }>;
  };
}

function money(value: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function FinanceSettingsCard() {
  const [status, setStatus] = useState<FinanceStatus | null>(null);
  const [setupToken, setSetupToken] = useState("");
  const [importJson, setImportJson] = useState("");
  const [loanName, setLoanName] = useState("");
  const [loanBalance, setLoanBalance] = useState("");
  const [loanApr, setLoanApr] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await getFinanceStatusAction();
    if (result.ok && result.data) setStatus(result.data as FinanceStatus);
    else setError(result.error ?? "Finance status could not be loaded.");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const lastSync = useMemo(() => {
    const values = status?.dashboard.accounts.map((account) => account.lastSyncedAt).filter((value): value is string => Boolean(value)) ?? [];
    if (values.length === 0) return "Never";
    const latest = values.sort().at(-1);
    return latest ? new Date(latest).toLocaleString() : "Never";
  }, [status]);

  async function connectSimpleFin() {
    if (!setupToken.trim() || busy) return;
    setBusy("connect");
    setError(null);
    setMessage(null);
    const result = await connectSimpleFinAction(setupToken);
    if (result.ok) {
      setSetupToken("");
      setMessage("SimpleFIN connected and finance data synced.");
      await load();
    } else setError(result.error ?? "SimpleFIN connection failed.");
    setBusy(null);
  }

  async function sync() {
    if (busy) return;
    setBusy("sync");
    setError(null);
    setMessage(null);
    const result = await syncFinanceAction();
    if (result.ok) {
      setMessage("Finance data refreshed.");
      await load();
    } else setError(result.error ?? "Finance sync failed.");
    setBusy(null);
  }

  async function disconnect() {
    if (busy) return;
    setBusy("disconnect");
    setError(null);
    setMessage(null);
    const result = await disconnectSimpleFinAction();
    if (result.ok) {
      setMessage("SimpleFIN disconnected. Imported history was kept.");
      await load();
    } else setError(result.error ?? "Could not disconnect SimpleFIN.");
    setBusy(null);
  }

  async function saveLoan() {
    if (!loanName.trim() || !loanBalance || busy) return;
    const balance = Number(loanBalance);
    const apr = loanApr.trim() ? Number(loanApr) : null;
    if (!Number.isFinite(balance) || balance < 0 || (apr != null && (!Number.isFinite(apr) || apr < 0 || apr > 100))) {
      setError("Enter a valid balance and APR.");
      return;
    }
    setBusy("loan");
    setError(null);
    setMessage(null);
    const result = await saveManualLiabilityAction({
      providerLiabilityId: `manual:${loanName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: loanName.trim(),
      liabilityType: "student_loan",
      balance,
      apr,
      minimumPayment: null,
      dueDate: null,
      accruedInterest: null,
      currency: "USD",
      sourceUpdatedAt: new Date().toISOString(),
    });
    if (result.ok) {
      setLoanName("");
      setLoanBalance("");
      setLoanApr("");
      setMessage("Student loan balance saved.");
      await load();
    } else setError(result.error ?? "Student loan could not be saved.");
    setBusy(null);
  }

  async function importNormalizedJson() {
    if (!importJson.trim() || busy) return;
    setBusy("import");
    setError(null);
    setMessage(null);
    const result = await importFinanceJsonAction(importJson);
    if (result.ok) {
      setImportJson("");
      setMessage("Finance import applied without duplicating provider IDs.");
      await load();
    } else setError(result.error ?? "Finance import failed.");
    setBusy(null);
  }

  const summary = status?.dashboard.summary;

  return (
    <Card>
      <CardHeader title="Finances" subtitle="Read-only tracking. Automate what is reliable; keep holdouts easy to update manually." right={<CircleDollarSign className="h-4 w-4 text-emerald-400" />} />
      <div className="flex flex-col gap-4">
        {summary && (
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-800 bg-zinc-950/30 p-3 text-xs">
            <div><p className="text-zinc-500">Cash</p><p className="mt-1 text-sm font-semibold text-zinc-200">{money(summary.cash)}</p></div>
            <div><p className="text-zinc-500">Total debt</p><p className="mt-1 text-sm font-semibold text-zinc-200">{money(summary.totalDebt)}</p></div>
            <div><p className="text-zinc-500">Credit cards</p><p className="mt-1 text-sm font-semibold text-zinc-200">{money(summary.creditCardDebt)}</p></div>
            <div><p className="text-zinc-500">Student loans</p><p className="mt-1 text-sm font-semibold text-zinc-200">{money(summary.studentLoanDebt)}</p></div>
          </div>
        )}

        <section className="rounded-xl border border-zinc-800 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-200">SimpleFIN</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">Best-effort automatic checking/card sync. The access URL is encrypted in an HttpOnly cookie and never shown again.</p>
            </div>
            <span className={`text-[11px] ${status?.simplefin.configured ? "text-emerald-400" : "text-zinc-500"}`}>{status?.simplefin.configured ? "Connected" : "Not connected"}</span>
          </div>
          {status?.simplefin.configured ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={sync} disabled={Boolean(busy)}><RefreshCw className={`h-3.5 w-3.5 ${busy === "sync" ? "animate-spin" : ""}`} />{busy === "sync" ? "Syncing…" : "Sync now"}</Button>
              <Button size="sm" variant="ghost" onClick={disconnect} disabled={Boolean(busy)}>{busy === "disconnect" ? "Disconnecting…" : "Disconnect"}</Button>
              <span className="text-[11px] text-zinc-600">Last sync: {lastSync}</span>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              <textarea value={setupToken} onChange={(event) => setSetupToken(event.target.value)} placeholder="Paste one-time SimpleFIN setup token" className="min-h-20 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-700" />
              <div><Button size="sm" onClick={connectSimpleFin} disabled={Boolean(busy) || !setupToken.trim()}>{busy === "connect" ? "Connecting…" : "Connect SimpleFIN"}</Button></div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-zinc-800 p-3">
          <p className="text-sm font-semibold text-zinc-200">Student loans / unsupported accounts</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">A monthly balance is enough when a servicer will not connect. This avoids brittle credential scraping.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input value={loanName} onChange={(event) => setLoanName(event.target.value)} placeholder="Loan / servicer" className="col-span-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-700" />
            <input inputMode="decimal" value={loanBalance} onChange={(event) => setLoanBalance(event.target.value)} placeholder="Balance" className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-700" />
            <input inputMode="decimal" value={loanApr} onChange={(event) => setLoanApr(event.target.value)} placeholder="APR % (optional)" className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-700" />
          </div>
          <div className="mt-2"><Button size="sm" variant="secondary" onClick={saveLoan} disabled={Boolean(busy) || !loanName.trim() || !loanBalance}>{busy === "loan" ? "Saving…" : "Save loan balance"}</Button></div>
        </section>

        <details className="rounded-xl border border-zinc-800 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-200">Actual / other finance hub import</summary>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">Actual does not expose a REST API. Year Mission accepts a normalized JSON export so a local Actual script/CLI can push accounts, transactions, and liabilities without giving Year Mission bank credentials.</p>
          <textarea value={importJson} onChange={(event) => setImportJson(event.target.value)} placeholder='{"provider":"actual","generatedAt":"...","accounts":[],"transactions":[],"liabilities":[]}' className="mt-3 min-h-28 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[11px] text-zinc-200 outline-none focus:border-zinc-700" />
          <div className="mt-2"><Button size="sm" variant="secondary" onClick={importNormalizedJson} disabled={Boolean(busy) || !importJson.trim()}>{busy === "import" ? "Importing…" : "Import JSON"}</Button></div>
        </details>

        <div className="flex items-start gap-2 rounded-xl border border-emerald-950/60 bg-emerald-950/10 p-3 text-[11px] leading-relaxed text-emerald-200/75"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />Year Mission stores normalized balances and transactions only. It never asks for bank usernames or passwords.</div>
        {message && <p className="text-xs text-emerald-400">{message}</p>}
        {error && <p className="text-xs leading-relaxed text-amber-300">{error}</p>}
      </div>
    </Card>
  );
}
