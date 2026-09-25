"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { CalendarClock } from "lucide-react";
import { getAnticipationAction, planAnticipationItemAction } from "@/app/anticipation-actions";
import type { AnticipationItem } from "@/domain/anticipation";

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function when(item: AnticipationItem): string {
  if (item.daysAway === 0) return "today";
  if (item.daysAway === 1) return "tomorrow";
  return `in ${item.daysAway} days`;
}

export function ComingUpCard() {
  const [items, setItems] = useState<AnticipationItem[]>([]);
  const [actionable, setActionable] = useState<AnticipationItem | null>(null);
  const [calendarOutcome, setCalendarOutcome] = useState<"ok" | "not_connected" | "error" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await getAnticipationAction(localToday(), 45, Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
        if (!result.ok) {
          setError(result.error ?? "Coming Up could not be loaded.");
          setLoaded(true);
          return;
        }
        setItems(result.data.items.slice(0, 4));
        setActionable(result.data.planningNow[0] ?? null);
        setCalendarOutcome(result.data.calendarOutcome);
        setError(null);
        setLoaded(true);
      } catch {
        setError("Coming Up could not be loaded.");
        setLoaded(true);
      }
    });
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(load);
    return () => window.cancelAnimationFrame(frame);
  }, [load]);
  if (!loaded && isPending) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 px-3 py-2.5">
        <p className="text-xs text-zinc-500">Loading Coming Up…</p>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="rounded-xl border border-red-950/50 bg-red-950/10 px-3 py-2.5">
        <p role="alert" className="text-xs text-red-300">{error}</p>
        <button type="button" onClick={load} className="mt-2 text-[11px] text-zinc-400 hover:text-zinc-200">Try again</button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 px-3 py-2.5">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-4 w-4 shrink-0 text-zinc-500" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-zinc-500">Coming up</p>
            <p className="text-sm text-zinc-400">Nothing in the near-term horizon.</p>
          </div>
          <Link href="/upcoming" className="shrink-0 text-[11px] text-zinc-500 hover:text-zinc-300">Plan ahead</Link>
        </div>
      </div>
    );
  }


  function plan(item: AnticipationItem) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await planAnticipationItemAction({ key: item.key, title: item.title, date: item.date, kind: item.kind, leadDays: item.leadDays, personName: item.personName });
        if (!result.ok) {
          setError(result.error ?? "Could not create the planning task.");
          return;
        }
        load();
      } catch {
        setError("Could not create the planning task.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-amber-950/70 bg-amber-950/10 px-3 py-2.5">
      <div className="flex items-center gap-3">
        <CalendarClock className="h-4 w-4 shrink-0 text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-zinc-500">Coming up</p>
          <p className="truncate text-sm text-zinc-300"><span className="mr-2 text-zinc-500">{when(items[0])}</span>{items[0].title}</p>
        </div>
        <Link href="/upcoming" className="shrink-0 text-[11px] text-zinc-600 hover:text-zinc-300">Plan ahead</Link>
      </div>
      {calendarOutcome && calendarOutcome !== "ok" && (
        <p className="mt-2 border-t border-zinc-800 pt-2 text-[10px] text-amber-300/70">
          Google Calendar is {calendarOutcome === "not_connected" ? "not connected" : "temporarily unavailable"}; other dates are still shown.
        </p>
      )}
      {actionable && (
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-amber-950/50 pt-2">
          <p className="truncate text-[11px] text-amber-200/80">Prep window open · {actionable.title}</p>
          <button disabled={isPending} onClick={() => plan(actionable)} className="shrink-0 rounded-lg border border-amber-800/60 px-2 py-1 text-[10px] text-amber-200 disabled:opacity-50">Create plan task</button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-[11px] text-red-300">{error}</p>}
    </div>
  );
}
