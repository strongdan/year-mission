"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
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

function eventDay(event: EventItem): string {
  return eventDate(event).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function NextCalendarEvent() {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

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

  const upcoming = data.events
    .filter((event) => event.allDay || loadedAt === null || new Date(event.end).getTime() >= loadedAt)
    .sort((a, b) => eventDate(a).getTime() - eventDate(b).getTime());
  const next = upcoming[0];

  if (!next) return null;

  return (
    <div className="rounded-xl border border-sky-950/80 bg-sky-950/10 px-3 py-2.5">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-4 w-4 shrink-0 text-sky-400" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-zinc-500">Next calendar constraint</p>
          <p className="truncate text-sm text-zinc-300">
            <span className="mr-2 text-zinc-500">{eventTime(next)}</span>{next.title}
          </p>
        </div>
        {upcoming.length > 1 && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="inline-flex shrink-0 items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-300"
          >
            Week {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 divide-y divide-sky-950/60 border-t border-sky-950/60">
          {upcoming.slice(1, 8).map((event) => (
            <div key={event.id} className="grid grid-cols-[74px_1fr] gap-2 py-2.5 text-xs">
              <span className="text-zinc-600">{eventDay(event)}</span>
              <div className="min-w-0">
                <p className="truncate text-zinc-300">{event.title}</p>
                <p className="mt-0.5 text-[11px] text-zinc-600">{eventTime(event)}</p>
              </div>
            </div>
          ))}
          {upcoming.length > 8 && <p className="pt-2.5 text-[11px] text-zinc-600">Showing the next 8 events.</p>}
        </div>
      )}
    </div>
  );
}
