"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ExternalLink } from "lucide-react";
import { getCalendarWeekAction } from "@/app/calendar-actions";
import { connectGoogleTasksAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

type CalendarData = NonNullable<Awaited<ReturnType<typeof getCalendarWeekAction>>["data"]>;
type EventItem = CalendarData["events"][number];

function dateOnlyParts(value: string): { year: number; month: number; day: number } | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
}

function eventDate(event: EventItem): Date {
  const dateOnly = event.allDay ? dateOnlyParts(event.start) : null;
  if (dateOnly) return new Date(dateOnly.year, dateOnly.month, dateOnly.day, 12, 0, 0);
  return new Date(event.start);
}

function dayKey(event: EventItem): string {
  const d = eventDate(event);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function dayLabel(event: EventItem): string {
  return eventDate(event).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function eventTime(event: EventItem): string {
  if (event.allDay) return "All day";
  const start = new Date(event.start);
  const end = new Date(event.end);
  const format = (date: Date) => date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${format(start)}–${format(end)}`;
}

export function WeekSchedule() {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCalendarWeekAction().then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res.ok || !res.data) {
        setError(res.error ?? "Calendar could not be loaded.");
        return;
      }
      setData(res.data);
      setError(res.data.error ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleEvents = useMemo(() => {
    if (!data) return [];
    const now = Date.now();
    return data.events
      .filter((event) => event.allDay || new Date(event.end).getTime() >= now)
      .sort((a, b) => eventDate(a).getTime() - eventDate(b).getTime())
      .slice(0, 10);
  }, [data]);

  const groups = useMemo(() => {
    const result: Array<{ key: string; label: string; events: EventItem[] }> = [];
    for (const event of visibleEvents) {
      const key = dayKey(event);
      const existing = result.find((group) => group.key === key);
      if (existing) existing.events.push(event);
      else result.push({ key, label: dayLabel(event), events: [event] });
    }
    return result;
  }, [visibleEvents]);

  async function connect() {
    if (connecting) return;
    setConnecting(true);
    setError(null);
    const res = await connectGoogleTasksAction();
    if (res.ok && res.data?.url) {
      window.location.href = res.data.url;
      return;
    }
    setConnecting(false);
    setError(res.error ?? "Could not start Google connection.");
  }

  if (loading) {
    return (
      <Card>
        <CardHeader title="This week" subtitle="Loading calendar…" right={<CalendarDays className="h-4 w-4 text-sky-400" />} />
      </Card>
    );
  }

  const needsConnection = data?.outcome === "not_connected" || data?.needsReconnect;
  const notConfigured = data?.outcome === "not_configured";

  return (
    <Card className="border-sky-950/80 bg-sky-950/15">
      <CardHeader
        title="This week"
        subtitle="Your schedule, so the plan fits the life you actually have."
        right={<CalendarDays className="h-4 w-4 text-sky-400" />}
      />

      {notConfigured && (
        <p className="text-xs leading-relaxed text-zinc-500">
          Google Calendar is ready in the app, but the Google integration still needs server credentials.
        </p>
      )}

      {needsConnection && (
        <div className="flex flex-col gap-3">
          <p className="text-xs leading-relaxed text-zinc-400">
            {data?.needsReconnect
              ? "Reconnect Google once to add read-only Calendar access. Your existing Year Mission tasks stay intact."
              : "Connect Google to see this week's schedule alongside your commitments."}
          </p>
          <div>
            <Button size="sm" variant="secondary" onClick={connect} disabled={connecting}>
              {connecting ? "Connecting…" : data?.needsReconnect ? "Reconnect Google" : "Connect Google"}
            </Button>
          </div>
        </div>
      )}

      {data?.outcome === "ok" && groups.length === 0 && (
        <p className="text-sm text-zinc-500">No remaining events on your primary calendar this week.</p>
      )}

      {data?.outcome === "ok" && groups.length > 0 && (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div key={group.key}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky-300/80">{group.label}</p>
              <div className="flex flex-col gap-1.5">
                {group.events.map((event) => (
                  <div key={event.id} className="flex min-w-0 items-start gap-3 rounded-xl border border-sky-950/60 bg-zinc-950/35 px-3 py-2.5">
                    <span className="w-[78px] shrink-0 pt-0.5 text-[11px] tabular-nums text-zinc-500">{eventTime(event)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-zinc-200">{event.title}</p>
                      {event.location && <p className="mt-0.5 truncate text-[11px] text-zinc-500">{event.location}</p>}
                    </div>
                    {event.htmlLink && (
                      <a
                        href={event.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${event.title} in Google Calendar`}
                        className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {data.events.length > visibleEvents.length && (
            <p className="text-[11px] text-zinc-600">Showing the next {visibleEvents.length} events.</p>
          )}
        </div>
      )}

      {error && data?.outcome !== "ok" && <p className="mt-3 text-xs text-amber-300/80">{error}</p>}
    </Card>
  );
}
