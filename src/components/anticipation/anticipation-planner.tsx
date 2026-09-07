"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  addImportantDateAction,
  deleteImportantDateAction,
  getAnticipationAction,
  planAnticipationItemAction,
} from "@/app/anticipation-actions";
import type { AnticipationItem, AnticipationKind } from "@/domain/anticipation";

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function labelForKind(kind: AnticipationKind): string {
  return ({ birthday: "Birthday", anniversary: "Anniversary", deadline: "Deadline", holiday: "Holiday", travel: "Travel", calendar: "Calendar", other: "Important date" } as const)[kind];
}

function whenLabel(item: AnticipationItem): string {
  if (item.daysAway === 0) return "Today";
  if (item.daysAway === 1) return "Tomorrow";
  if (item.daysAway < 7) return `In ${item.daysAway} days`;
  const weeks = Math.round(item.daysAway / 7);
  if (item.daysAway < 35) return `In ${weeks} week${weeks === 1 ? "" : "s"}`;
  return new Date(`${item.date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AnticipationPlanner() {
  const [items, setItems] = useState<AnticipationItem[]>([]);
  const [planningNow, setPlanningNow] = useState<AnticipationItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [kind, setKind] = useState<Exclude<AnticipationKind, "calendar" | "holiday">>("birthday");
  const [title, setTitle] = useState("");
  const [personName, setPersonName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [notes, setNotes] = useState("");
  const [leadDays, setLeadDays] = useState(21);
  const [recurrence, setRecurrence] = useState<"none" | "yearly">("yearly");
  const [isPending, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      const result = await getAnticipationAction(localToday(), 120);
      if (!result.ok) return setMessage(result.error);
      setItems(result.data.items);
      setPlanningNow(result.data.planningNow);
    });
  };

  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const result: Array<{ label: string; items: AnticipationItem[] }> = [];
    for (const item of items) {
      const date = new Date(`${item.date}T12:00:00`);
      const label = date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
      const group = result.find((entry) => entry.label === label);
      if (group) group.items.push(item); else result.push({ label, items: [item] });
    }
    return result;
  }, [items]);

  function changeKind(next: typeof kind) {
    setKind(next);
    if (next === "birthday" || next === "anniversary") {
      setRecurrence("yearly");
      setLeadDays(21);
    } else if (next === "deadline") {
      setRecurrence("none");
      setLeadDays(7);
    } else if (next === "travel") {
      setRecurrence("none");
      setLeadDays(21);
    } else {
      setRecurrence("none");
      setLeadDays(7);
    }
  }

  function addDate() {
    if (!title.trim() || !eventDate) return setMessage("Add a name and date first.");
    setMessage(null);
    startTransition(async () => {
      const result = await addImportantDateAction({
        title: title.trim(),
        kind,
        eventDate,
        recurrence,
        leadDays,
        personName: personName.trim() || null,
        notes: notes.trim() || null,
      });
      if (!result.ok) return setMessage(result.error);
      setTitle(""); setPersonName(""); setEventDate(""); setNotes("");
      setShowAdd(false);
      setMessage("Important date saved.");
      load();
    });
  }

  function plan(item: AnticipationItem) {
    setMessage(null);
    startTransition(async () => {
      const result = await planAnticipationItemAction({
        key: item.key,
        title: item.title,
        date: item.date,
        kind: item.kind,
        leadDays: item.leadDays,
        personName: item.personName,
      });
      if (!result.ok) return setMessage(result.error);
      setMessage(result.data.alreadyPlanned ? "A planning task already exists." : "Planning task added to your task system.");
      load();
    });
  }

  function remove(item: AnticipationItem) {
    const match = /^important:([0-9a-f-]+):/.exec(item.key);
    if (!match) return;
    startTransition(async () => {
      const result = await deleteImportantDateAction(match[1]);
      if (!result.ok) return setMessage(result.error);
      load();
    });
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Coming Up</h1>
          <p className="mt-1 max-w-xl text-sm leading-5 text-zinc-500">See dates early enough to do something about them. Birthdays, holidays, deadlines, travel, tasks, and your Google Calendar are combined here.</p>
        </div>
        <button onClick={() => setShowAdd((value) => !value)} className="shrink-0 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-500">{showAdd ? "Close" : "Add date"}</button>
      </header>

      {message && <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-300">{message}</p>}

      {showAdd && (
        <section className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <h2 className="text-sm font-semibold text-zinc-200">Remember an important date</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-zinc-500">Type
              <select value={kind} onChange={(event) => changeKind(event.target.value as typeof kind)} className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-zinc-200">
                <option value="birthday">Birthday</option><option value="anniversary">Anniversary</option><option value="deadline">Deadline</option><option value="travel">Travel</option><option value="other">Other</option>
              </select>
            </label>
            <label className="text-xs text-zinc-500">Date
              <input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-zinc-200" />
            </label>
            <label className="text-xs text-zinc-500">Name
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={kind === "birthday" ? "Alex's birthday" : "Important date"} className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-zinc-200" />
            </label>
            {(kind === "birthday" || kind === "anniversary") && <label className="text-xs text-zinc-500">Person
              <input value={personName} onChange={(event) => setPersonName(event.target.value)} placeholder="Alex" className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-zinc-200" />
            </label>}
            <label className="text-xs text-zinc-500">Start preparing this many days early
              <input type="number" min={0} max={120} value={leadDays} onChange={(event) => setLeadDays(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-zinc-200" />
            </label>
            <label className="text-xs text-zinc-500">Repeats
              <select value={recurrence} onChange={(event) => setRecurrence(event.target.value as "none" | "yearly")} className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-zinc-200"><option value="none">Does not repeat</option><option value="yearly">Every year</option></select>
            </label>
          </div>
          <label className="mt-3 block text-xs text-zinc-500">Notes
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-zinc-200" />
          </label>
          <button disabled={isPending} onClick={addDate} className="mt-3 rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50">Save date</button>
        </section>
      )}

      <section className="mt-5 rounded-2xl border border-amber-900/40 bg-amber-950/10 p-4">
        <div className="flex items-baseline justify-between gap-3"><h2 className="text-sm font-semibold text-amber-100">Worth planning now</h2><span className="text-[11px] text-zinc-600">{planningNow.length}</span></div>
        {planningNow.length === 0 ? <p className="mt-2 text-xs text-zinc-500">Nothing needs advance preparation right now.</p> : (
          <div className="mt-3 divide-y divide-amber-950/50">
            {planningNow.slice(0, 8).map((item) => <div key={item.key} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1"><p className="truncate text-sm text-zinc-200">{item.title}</p><p className="mt-0.5 text-[11px] text-zinc-500">{labelForKind(item.kind)} · {whenLabel(item)} · prep window started {new Date(`${item.prepDate}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p></div>
              <button disabled={isPending} onClick={() => plan(item)} className="shrink-0 rounded-lg border border-amber-800/60 px-2.5 py-1.5 text-[11px] text-amber-200 hover:border-amber-600">Plan</button>
            </div>)}
          </div>
        )}
      </section>

      <section className="mt-5 space-y-5">
        {grouped.map((group) => <div key={group.label}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">{group.label}</h2>
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/45">
            {group.items.map((item, index) => <div key={item.key} className={`flex items-center gap-3 px-3 py-3 ${index ? "border-t border-zinc-800" : ""}`}>
              <div className="w-12 shrink-0 text-center"><p className="text-lg font-semibold text-zinc-200">{Number(item.date.slice(8, 10))}</p><p className="text-[10px] uppercase text-zinc-600">{new Date(`${item.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</p></div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm text-zinc-200">{item.title}</p><p className="mt-0.5 text-[11px] text-zinc-500">{labelForKind(item.kind)} · {item.source === "google_calendar" ? "Google Calendar" : item.source === "task" ? "Task deadline" : item.source === "holiday" ? "Built-in holiday" : "Saved date"}{item.plannedTaskId ? " · planned ✓" : ""}</p></div>
              {!item.plannedTaskId && <button disabled={isPending} onClick={() => plan(item)} className="shrink-0 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-[11px] text-zinc-300 hover:border-zinc-500">Plan</button>}
              {item.source === "manual" && <button onClick={() => remove(item)} className="shrink-0 px-1 text-[11px] text-zinc-700 hover:text-zinc-400" aria-label={`Delete ${item.title}`}>×</button>}
            </div>)}
          </div>
        </div>)}
      </section>

      <div className="mt-6 rounded-xl border border-zinc-900 bg-zinc-950/30 p-3 text-[11px] leading-4 text-zinc-600">
        Birthdays and anniversaries can repeat yearly. Google Calendar is read-only here. A Plan action creates an ordinary Year Mission task at the start of the preparation window; nothing is silently added to Today. <Link href="/settings" className="text-zinc-400 hover:text-zinc-200">Google settings</Link>
      </div>
    </div>
  );
}
