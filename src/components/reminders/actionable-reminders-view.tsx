"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ExternalLink, Play, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import {
  completeActionableReminderAction,
  createActionableReminderAction,
  deleteActionableReminderAction,
  listActionableRemindersAction,
  markActionableReminderLaunchedAction,
  rescheduleActionableReminderAction,
  type ActionableReminderRecord,
} from "@/app/actionable-reminder-actions";
import { daysOverdue, isReminderDue } from "@/domain/actionable-reminders";

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function prettyDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ActionableRemindersView() {
  const [items, setItems] = useState<ActionableReminderRecord[]>([]);
  const [migrationReady, setMigrationReady] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [launchStep, setLaunchStep] = useState("");
  const [launchUrl, setLaunchUrl] = useState("");
  const [nextDueDate, setNextDueDate] = useState(localToday());
  const [recurrenceDays, setRecurrenceDays] = useState("");
  const [rescheduleDays, setRescheduleDays] = useState("7");

  const today = localToday();

  const load = useCallback(async () => {
    const result = await listActionableRemindersAction();
    if (!result.ok) {
      setError(result.error ?? "Could not load reminders.");
      return;
    }
    setItems(result.data);
    setMigrationReady(result.migrationReady);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const due = useMemo(() => items.filter((item) => isReminderDue(item.next_due_date, today)), [items, today]);
  const later = useMemo(() => items.filter((item) => !isReminderDue(item.next_due_date, today)), [items, today]);

  async function create() {
    if (!title.trim() || !launchStep.trim() || busy) return;
    setBusy("create");
    setError(null);
    const result = await createActionableReminderAction({
      title,
      launchStep,
      launchUrl: launchUrl.trim() || null,
      nextDueDate,
      recurrenceDays: recurrenceDays ? Number(recurrenceDays) : null,
      defaultRescheduleDays: Number(rescheduleDays) || 7,
    });
    setBusy(null);
    if (!result.ok) {
      setError(result.error ?? "Could not create reminder.");
      return;
    }
    setTitle("");
    setLaunchStep("");
    setLaunchUrl("");
    setRecurrenceDays("");
    await load();
  }

  async function launch(item: ActionableReminderRecord) {
    setBusy(item.id);
    await markActionableReminderLaunchedAction(item.id);
    if (item.launch_url) window.open(item.launch_url, "_blank", "noopener,noreferrer");
    setBusy(null);
    await load();
  }

  async function reschedule(item: ActionableReminderRecord) {
    setBusy(item.id);
    await rescheduleActionableReminderAction({ id: item.id, today });
    setBusy(null);
    await load();
  }

  async function complete(item: ActionableReminderRecord) {
    setBusy(item.id);
    await completeActionableReminderAction({ id: item.id, completedOn: today });
    setBusy(null);
    await load();
  }

  async function remove(item: ActionableReminderRecord) {
    setBusy(item.id);
    await deleteActionableReminderAction(item.id);
    setBusy(null);
    await load();
  }

  function ReminderCard({ item }: { item: ActionableReminderRecord }) {
    const overdue = daysOverdue(item.next_due_date, today);
    const dueNow = isReminderDue(item.next_due_date, today);
    return (
      <div className={`rounded-xl border p-3 ${dueNow ? "border-amber-900/70 bg-amber-950/15" : "border-zinc-800 bg-zinc-950/20"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-200">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400"><span className="text-zinc-600">First step:</span> {item.launch_step}</p>
            <p className="mt-1 text-[11px] text-zinc-600">
              {dueNow ? (overdue > 0 ? `${overdue} day${overdue === 1 ? "" : "s"} overdue` : "Due today") : `Due ${prettyDate(item.next_due_date)}`}
              {item.recurrence_days ? ` · repeats every ${item.recurrence_days} days` : " · one time"}
            </p>
          </div>
          <button onClick={() => void remove(item)} disabled={busy === item.id} aria-label={`Delete ${item.title}`} className="rounded-lg p-1.5 text-zinc-700 hover:bg-zinc-900 hover:text-red-400 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
        {dueNow && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void launch(item)} disabled={busy === item.id}><Play className="h-3.5 w-3.5" /> {item.launch_url ? "Launch now" : "I started"}</Button>
            <Button size="sm" variant="secondary" onClick={() => void complete(item)} disabled={busy === item.id}><Check className="h-3.5 w-3.5" /> Done</Button>
            <Button size="sm" variant="ghost" onClick={() => void reschedule(item)} disabled={busy === item.id}>Not now → {item.default_reschedule_days}d</Button>
            {item.launch_url && <a href={item.launch_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-200">Open link <ExternalLink className="h-3 w-3" /></a>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-10">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Actionable reminders</h1>
          <p className="mt-0.5 text-xs text-zinc-500">Notice → launch → commit. A reminder should start an action, not another decision.</p>
        </div>
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200"><ArrowLeft className="h-3.5 w-3.5" /> Today</Link>
      </header>

      {!migrationReady && <Card className="border-amber-900/60"><p className="text-xs text-amber-300">Apply database migration <code>0019_actionable_reminders.sql</code> before using this feature.</p></Card>}

      {due.length > 0 && (
        <Card className="border-amber-950/70">
          <CardHeader title="Needs a decision now" subtitle="Take the first physical step within two minutes, or deliberately choose the next date." />
          <div className="flex flex-col gap-2">{due.map((item) => <ReminderCard key={item.id} item={item} />)}</div>
        </Card>
      )}

      <Card>
        <CardHeader title="Add actionable reminder" subtitle="Write the first step so small that you can begin it when the reminder appears." />
        <div className="flex flex-col gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Haircut" className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600" />
          <input value={launchStep} onChange={(e) => setLaunchStep(e.target.value)} placeholder="First step: open the barber booking page and take the first acceptable slot" className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600" />
          <input value={launchUrl} onChange={(e) => setLaunchUrl(e.target.value)} placeholder="Booking link (optional)" type="url" className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600" />
          <div className="grid grid-cols-3 gap-2">
            <label className="text-[11px] text-zinc-500">Due<input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-2 py-2 text-xs text-zinc-300" /></label>
            <label className="text-[11px] text-zinc-500">Repeat days<input inputMode="numeric" value={recurrenceDays} onChange={(e) => setRecurrenceDays(e.target.value.replace(/\D/g, ""))} placeholder="42" className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-2 py-2 text-xs text-zinc-300" /></label>
            <label className="text-[11px] text-zinc-500">Reschedule<input inputMode="numeric" value={rescheduleDays} onChange={(e) => setRescheduleDays(e.target.value.replace(/\D/g, ""))} className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-2 py-2 text-xs text-zinc-300" /></label>
          </div>
          <Button onClick={() => void create()} disabled={!migrationReady || busy === "create" || !title.trim() || !launchStep.trim()}><Plus className="h-4 w-4" /> {busy === "create" ? "Adding…" : "Add reminder"}</Button>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </Card>

      {later.length > 0 && (
        <Card>
          <CardHeader title="Coming later" subtitle="These stay quiet until their date arrives." />
          <div className="flex flex-col gap-2">{later.map((item) => <ReminderCard key={item.id} item={item} />)}</div>
        </Card>
      )}

      <p className="px-1 text-[11px] leading-relaxed text-zinc-600">For recurring maintenance, completion rolls the next reminder forward. “Not now” is allowed, but it always chooses a real date instead of disappearing into indefinite snooze.</p>
    </div>
  );
}
