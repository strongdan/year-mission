"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { getCalendarWeekAction } from "@/app/calendar-actions";

type CalendarData = NonNullable<Awaited<ReturnType<typeof getCalendarWeekAction>>["data"]>;
type EventItem = CalendarData["events"][number];

function eventDate(event: EventItem): Date {
  if (event.allDay && /^\d{4}-\d{2}-\d{2}$/.test(event.start)) {
    const [year, month, day] = event.start.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }
  return new Date(event.start);
}

function eventTime(event: EventItem): string {
  if (event.allDay) return "All day";
  return new Date(event.start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function NextCalendarEvent() {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCalendarWeekAction().then((result) => {
      if (cancelled) return;
      setLoadedAt(Date.now());
      if (result.ok && result.data) setData(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data || data.outcome !== "ok") return null;

  const next = data.events
    .filter((event) => event.allDay || loadedAt === null || new Date(event.end).getTime() >= loadedAt)
    .sort((a, b) => eventDate(a).getTime() - eventDate(b).getTime())[0];

  if (!next) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-sky-950/80 bg-sky-950/10 px-3 py-2.5">
      <CalendarDays className="h-4 w-4 shrink-0 text-sky-400" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-zinc-500">Next calendar constraint</p>
        <p className="truncate text-sm text-zinc-300">
          <span className="mr-2 text-zinc-500">{eventTime(next)}</span>{next.title}
        </p>
      </div>
      <Link href="/tasks" className="shrink-0 text-[11px] text-zinc-600 hover:text-zinc-300">Week</Link>
    </div>
  );
}
