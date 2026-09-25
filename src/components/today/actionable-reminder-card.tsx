"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Check, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  completeActionableReminderAction,
  listActionableRemindersAction,
  markActionableReminderLaunchedAction,
  rescheduleActionableReminderAction,
  type ActionableReminderRecord,
} from "@/app/actionable-reminder-actions";
import { isReminderDue } from "@/domain/actionable-reminders";

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function ActionableReminderCard() {
  const [item, setItem] = useState<ActionableReminderRecord | null>(null);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState(localToday());

  const load = useCallback(async () => {
    try {
      const result = await listActionableRemindersAction();
      if (!result.ok) {
        setError(result.error ?? "Could not load reminders.");
        return;
      }
      if (!result.migrationReady) {
        setItem(null);
        setCount(0);
        setError(null);
        return;
      }
      const due = result.data.filter((candidate) => isReminderDue(candidate.next_due_date, today));
      setItem(due[0] ?? null);
      setCount(due.length);
      setError(null);
    } catch {
      setError("Could not load reminders.");
    }
  }, [today]);

  useEffect(() => {
    const refreshDate = () => setToday((current) => {
      const next = localToday();
      return current === next ? current : next;
    });
    const frame = window.requestAnimationFrame(() => { refreshDate(); void load(); });
    const timer = window.setInterval(refreshDate, 60_000);
    const onVisible = () => { if (document.visibilityState === "visible") refreshDate(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  if (!item) {
    return error ? (
      <div className="px-4 pt-3">
        <Card className="border-red-950/50 bg-red-950/10">
          <p role="alert" className="text-xs text-red-300">{error}</p>
          <button type="button" onClick={() => void load()} className="mt-2 text-[11px] text-zinc-400 hover:text-zinc-200">Try again</button>
        </Card>
      </div>
    ) : null;
  }

  async function launch() {
    if (busy || !item) return;
    if (item.launch_url) window.open(item.launch_url, "_blank", "noopener,noreferrer");
    setBusy(true);
    setError(null);
    try {
      const result = await markActionableReminderLaunchedAction(item.id);
      if (!result.ok) setError(result.error ?? "Could not record that the reminder was started.");
    } catch {
      setError("Could not record that the reminder was started.");
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    if (busy || !item) return;
    setBusy(true);
    setError(null);
    try {
      const result = await completeActionableReminderAction({ id: item.id, completedOn: today, expectedDueDate: item.next_due_date });
      if (!result.ok) setError(result.error ?? "Could not complete the reminder.");
      else await load();
    } catch {
      setError("Could not complete the reminder.");
    } finally {
      setBusy(false);
    }
  }

  async function reschedule() {
    if (busy || !item) return;
    setBusy(true);
    setError(null);
    try {
      const result = await rescheduleActionableReminderAction({ id: item.id, today, expectedDueDate: item.next_due_date });
      if (!result.ok) setError(result.error ?? "Could not reschedule the reminder.");
      else await load();
    } catch {
      setError("Could not reschedule the reminder.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-4 pt-3">
      <Card className="border-amber-900/60 bg-amber-950/10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-500/80">Notice → launch → commit</p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">{item.launch_step}</p>
          </div>
          <Link href="/reminders" className="shrink-0 text-[11px] text-zinc-600 hover:text-zinc-300">{count > 1 ? `${count} due` : "Manage"}</Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => void launch()} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50"><Play className="h-3.5 w-3.5" /> {item.launch_url ? "Launch now" : "I started"}</button>
          <button onClick={() => void complete()} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Done</button>
          <button onClick={() => void reschedule()} disabled={busy} className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-300 disabled:opacity-50">Not now → {item.default_reschedule_days}d <ArrowRight className="h-3 w-3" /></button>
        </div>
        {item.launch_url && <a href={item.launch_url} target="_blank" rel="noreferrer" className="mt-2 block text-[11px] text-zinc-600 hover:text-zinc-300">Open action link directly</a>}
        {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
      </Card>
    </div>
  );
}
