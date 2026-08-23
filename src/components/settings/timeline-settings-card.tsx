"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarRange } from "lucide-react";
import {
  getTimelineSettingsAction,
  saveTimelineSettingsAction,
} from "@/app/timeline-settings-actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

type TimelineData = NonNullable<Awaited<ReturnType<typeof getTimelineSettingsAction>>["data"]>;

type StartDates = [string, string, string, string];

function addOneYear(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const [year, month, day] = value.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year + 1, month, 0)).getUTCDate();
  return `${String(year + 1).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

function formatDisplayDate(value: string): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function TimelineSettingsCard() {
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [starts, setStarts] = useState<StartDates>(["", "", "", ""]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const result = await getTimelineSettingsAction();
    if (!result.ok || !result.data) {
      setError(result.error ?? "Mission timeline could not be loaded.");
      setLoading(false);
      return;
    }
    setTimeline(result.data);
    setStarts(result.data.seasons.map((season) => season.startDate) as StartDates);
    setLoading(false);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void load());
    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  const computedEnd = useMemo(() => addOneYear(starts[0]), [starts]);
  const dirty = timeline
    ? starts.some((date, index) => date !== timeline.seasons[index]?.startDate)
    : false;

  async function save() {
    if (saving || !dirty) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    const result = await saveTimelineSettingsAction({ starts });
    if (!result.ok) {
      setError(result.error ?? "Could not save mission dates.");
      setSaving(false);
      return;
    }
    setMessage("Mission timeline updated. Today and Coach now use the new season dates.");
    await load();
    setSaving(false);
  }

  function changeStart(index: number, value: string) {
    setStarts((current) => {
      const next = [...current] as StartDates;
      next[index] = value;
      return next;
    });
    setMessage(null);
  }

  return (
    <div className="px-4 pb-4">
      <Card className="border-amber-950/70 bg-amber-950/10">
        <CardHeader
          title="Mission timeline"
          subtitle="Change when the year and each season begin. Season end dates are recalculated automatically."
          right={<CalendarRange className="h-4 w-4 text-amber-400" />}
        />

        {loading ? (
          <p className="text-sm text-zinc-500">Loading mission dates…</p>
        ) : error && !timeline ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : timeline ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/25 px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-200">{timeline.plan.title}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">One-year mission · end date follows the first start date</p>
                </div>
                <p className="text-right text-xs text-zinc-400">
                  {formatDisplayDate(starts[0])}<br />
                  <span className="text-zinc-600">to {formatDisplayDate(computedEnd)}</span>
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              {timeline.seasons.map((season, index) => (
                <label key={season.sequence} className="grid grid-cols-[1fr_150px] items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/20 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200">
                      {index === 0 ? "Year starts / " : ""}{season.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-600">Season {season.sequence}</p>
                  </div>
                  <input
                    type="date"
                    value={starts[index] ?? ""}
                    onChange={(event) => changeStart(index, event.target.value)}
                    className="min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-200 outline-none focus:border-amber-700"
                  />
                </label>
              ))}
            </div>

            <p className="text-[11px] leading-relaxed text-zinc-600">
              Starts must stay in order. The first date is also the Year Mission start; the mission ends one calendar year later. Monthly focuses remain tied to calendar months, so changing these dates does not rename or move August, September, etc.
            </p>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={save} disabled={!dirty || saving}>
                {saving ? "Saving…" : "Save dates"}
              </Button>
              {dirty && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setStarts(timeline.seasons.map((season) => season.startDate) as StartDates)}
                  disabled={saving}
                >
                  Reset
                </Button>
              )}
            </div>

            {message && <p className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-300">{message}</p>}
            {error && <p className="rounded-xl border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs text-red-300">{error}</p>}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
