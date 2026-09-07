"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  const today = localToday();

  async function load() {
    const result = await listActionableRemindersAction();
    if (!result.ok || !result.migrationReady) return;
    const due = result.data.filter((candidate) => isReminderDue(candidate.next_due_date, today));
    setItem(due[0] ?? null);
    setCount(due.length);
  }

  useEffect(() => { void load(); }, []);

  if (!item) return null;

  async function launch() {
    if (busy || !item) return;
    setBusy(true);
    await markActionableReminderLaunchedAction(item.id);
    if (item.launch_url) window.open(item.launch_url, "_blank", "noopener,noreferrer");
    setBusy(false);
  }

  async function complete() {
    if (busy || !item) return;
    setBusy(true);
    await completeActionableReminderAction({ id: item.id, completedOn: today });
    setBusy(false);
    await load();
  }

  async function reschedule() {
    if (busy || !item) return;
    setBusy(true);
    await rescheduleActionableReminderAction({ id: item.id, today });
    setBusy(false);
    await load();
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
      </Card>
    </div>
  );
}
