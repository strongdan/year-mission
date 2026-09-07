"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      const result = await getAnticipationAction(localToday(), 45);
      if (result.ok) setItems(result.data.items.slice(0, 4));
    });
  };

  useEffect(() => { load(); }, []);
  if (items.length === 0) return null;

  const actionable = items.find((item) => item.planningNow && !item.plannedTaskId);

  function plan(item: AnticipationItem) {
    startTransition(async () => {
      await planAnticipationItemAction({ key: item.key, title: item.title, date: item.date, kind: item.kind, leadDays: item.leadDays, personName: item.personName });
      load();
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
      {actionable && (
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-amber-950/50 pt-2">
          <p className="truncate text-[11px] text-amber-200/80">Prep window open · {actionable.title}</p>
          <button disabled={isPending} onClick={() => plan(actionable)} className="shrink-0 rounded-lg border border-amber-800/60 px-2 py-1 text-[10px] text-amber-200 disabled:opacity-50">Create plan task</button>
        </div>
      )}
    </div>
  );
}
