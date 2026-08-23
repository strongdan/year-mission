"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  checkinAction,
  completeTaskAction,
  deferTaskAction,
  getDashboardAction,
  logWorkoutAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import type { DeferralReason } from "@/domain/constants";
import type { EveningResetCompletion } from "@/domain/evening-reset";
import { EveningResetCard } from "./evening-reset-card";
import { NextCalendarEvent } from "./next-calendar-event";
import { WhatShouldIDo } from "./what-should-i-do";

type DashboardData = Awaited<ReturnType<typeof getDashboardAction>>["data"];

const DEFERRAL_REASONS: { value: DeferralReason; label: string }[] = [
  { value: "too_big", label: "Too big" },
  { value: "dont_know_how", label: "Don't know how" },
  { value: "no_energy", label: "No energy" },
  { value: "not_important", label: "Not important" },
  { value: "blocked", label: "Blocked" },
  { value: "just_avoiding", label: "Just avoiding it" },
];

const SEASON_META: Record<string, { number: number; text: string; dot: string }> = {
  stabilize: { number: 1, text: "text-sky-300", dot: "bg-sky-400" },
  build: { number: 2, text: "text-emerald-300", dot: "bg-emerald-400" },
  transform: { number: 3, text: "text-violet-300", dot: "bg-violet-400" },
  convert: { number: 4, text: "text-amber-300", dot: "bg-amber-400" },
};

const BIG_FOUR_LABELS: Record<string, string> = {
  body: "Body",
  money: "Money",
  home: "Home",
  capability: "Career",
};

function domainLabel(slug?: string | null): string {
  if (!slug) return "";
  return BIG_FOUR_LABELS[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function TodayView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deferringTask, setDeferringTask] = useState<string | null>(null);
  const [alcoholFree, setAlcoholFree] = useState<boolean | null>(null);
  const [loggingWalk, setLoggingWalk] = useState(false);

  async function load() {
    const res = await getDashboardAction();
    if (!res.ok || !res.data) {
      setError(res.error ?? "Failed to load.");
      setLoading(false);
      return;
    }
    setData(res.data);
    setAlcoholFree(res.data.todayCheckin?.alcohol_free ?? false);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    getDashboardAction().then((res) => {
      if (cancelled) return;
      if (!res.ok || !res.data) {
        setError(res.error ?? "Failed to load.");
        setLoading(false);
        return;
      }
      setData(res.data);
      setAlcoholFree(res.data.todayCheckin?.alcohol_free ?? false);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="p-4 text-sm text-zinc-500">Loading…</div>;
  if (error || !data) return <div className="p-4 text-sm text-zinc-400">{error ?? "No data."}</div>;

  const now = new Date();
  const isEvening = now.getHours() >= 17;
  const primary = data.todayTasks[0];
  const remaining = data.todayTasks.slice(1);
  const usefulActionDone = data.completedToday.length > 0;
  const seasonKey = data.season?.name.toLowerCase() ?? "";
  const seasonMeta = SEASON_META[seasonKey];
  const monthName = now.toLocaleDateString(undefined, { month: "long" });
  const bigFourEntries = Object.entries(data.bigFour);
  const protectedAreas = bigFourEntries.filter(([, value]) => value.done >= value.target).length;
  const eveningResetCompletion = (data.todayCheckin?.evening_reset_completion ?? null) as EveningResetCompletion | null;

  async function toggleAlcoholFree() {
    const next = !alcoholFree;
    setAlcoholFree(next);
    await checkinAction({ alcoholFree: next });
  }

  async function logWalk() {
    if (loggingWalk || !data || data.walkToday) return;
    setLoggingWalk(true);
    await logWorkoutAction({ type: "walking", durationMinutes: 10 });
    setLoggingWalk(false);
    await load();
  }

  return (
    <div className="flex flex-col gap-3 p-4 pb-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Today</h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {isEvening ? "Close the day in about two minutes." : "See the next move, act, then leave the app."}
          </p>
        </div>
        <button
          onClick={toggleAlcoholFree}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            alcoholFree
              ? "border-emerald-700 bg-emerald-950/60 text-emerald-300"
              : "border-zinc-700 text-zinc-400"
          }`}
        >
          {alcoholFree ? "Alcohol-free ✓" : "Alcohol-free"}
        </button>
      </header>

      {(data.season || data.monthlyFocus) && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/35 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${seasonMeta?.dot ?? "bg-zinc-500"}`} />
            <p className="truncate text-xs text-zinc-400">
              <span className={`font-semibold ${seasonMeta?.text ?? "text-zinc-300"}`}>
                {seasonMeta ? `Season ${seasonMeta.number} · ` : ""}{data.season?.name ?? "Year Mission"}
              </span>
              {data.monthlyFocus ? ` · ${monthName}: ${data.monthlyFocus.title}` : ` · ${monthName}`}
            </p>
          </div>
          <Link href="/settings" className="shrink-0 text-[11px] text-zinc-600 hover:text-zinc-300">Timeline</Link>
        </div>
      )}

      {primary ? (
        <Card className="border-sky-800/70 bg-gradient-to-br from-sky-950/45 to-zinc-900/65">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-400/80">Do this next</p>
          <p className="mt-2 text-xl font-semibold leading-snug text-zinc-50">{primary.title}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-400">
            {primary.domain && <span>{domainLabel(primary.domain.slug)}</span>}
            {primary.estimated_minutes && <span>{primary.estimated_minutes} min</span>}
            {primary.defer_count > 0 && <span className="text-orange-300">Deferred ×{primary.defer_count}</span>}
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={() => completeTaskAction(primary.id).then(load)}>Done</Button>
            <Button size="sm" variant="secondary" onClick={() => setDeferringTask(deferringTask === primary.id ? null : primary.id)}>
              Can&apos;t start
            </Button>
          </div>
        </Card>
      ) : (
        <WhatShouldIDo onChange={load} />
      )}

      {deferringTask === primary?.id && (
        <Card className="border-orange-900/50 bg-orange-950/10">
          <CardHeader title="What's blocking the start?" subtitle="Choose one reason. The task will move out of the way." />
          <div className="flex flex-wrap gap-2">
            {DEFERRAL_REASONS.map((reason) => (
              <Button
                key={reason.value}
                size="sm"
                variant="secondary"
                onClick={() => {
                  deferTaskAction(primary.id, reason.value).then(() => {
                    setDeferringTask(null);
                    load();
                  });
                }}
              >
                {reason.label}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <NextCalendarEvent />

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-200">Today</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {remaining.length ? `${remaining.length} thing${remaining.length === 1 ? "" : "s"} after the current action` : "Nothing else committed after the current action"}
            </p>
          </div>
          <Link href="/tasks" className="text-xs text-zinc-500 hover:text-zinc-200">Manage</Link>
        </div>
        {remaining.length > 0 && (
          <div className="mt-3 divide-y divide-zinc-800/80">
            {remaining.map((task) => (
              <div key={task.id} className="flex items-center gap-3 py-2.5">
                <button
                  onClick={() => completeTaskAction(task.id).then(load)}
                  aria-label={`Complete ${task.title}`}
                  className="h-5 w-5 shrink-0 rounded-full border border-zinc-700 text-[11px] text-zinc-700 transition-colors hover:border-emerald-500 hover:text-emerald-400"
                >
                  ✓
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-300">{task.title}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-600">
                    {[task.domain ? domainLabel(task.domain.slug) : null, task.estimated_minutes ? `${task.estimated_minutes} min` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="bg-zinc-900/35">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-200">This week</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">{protectedAreas} of 4 areas protected</p>
          </div>
          <Link href="/progress" className="text-xs text-zinc-500 hover:text-zinc-200">Details</Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          {bigFourEntries.map(([key, value]) => {
            const met = value.done >= value.target;
            return (
              <div key={key} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-zinc-400">{BIG_FOUR_LABELS[key] ?? key}</span>
                <span className={met ? "text-emerald-400" : "text-zinc-600"}>{met ? "✓" : `${value.done}/${value.target}`}</span>
              </div>
            );
          })}
        </div>
        {data.weeklyWin && (
          <div className="mt-3 border-t border-zinc-800 pt-2.5">
            <p className="text-[11px] text-zinc-500">Weekly Win</p>
            <p className="mt-0.5 truncate text-sm text-amber-100">{data.weeklyWin.title}</p>
          </div>
        )}
      </Card>

      {isEvening && (
        <section className="mt-1 flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Close the day</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Three quick checks, then you&apos;re done.</p>
          </div>
          <Card>
            <div className="divide-y divide-zinc-800/80">
              <button onClick={toggleAlcoholFree} className="flex w-full items-center justify-between gap-3 py-2.5 text-left">
                <span className="text-sm text-zinc-300">Alcohol-free</span>
                <span className={alcoholFree ? "text-xs text-emerald-400" : "text-xs text-zinc-600"}>{alcoholFree ? "Done ✓" : "Mark"}</span>
              </button>
              <button onClick={logWalk} disabled={loggingWalk || data.walkToday} className="flex w-full items-center justify-between gap-3 py-2.5 text-left disabled:opacity-80">
                <span className="text-sm text-zinc-300">10-minute walk</span>
                <span className={data.walkToday ? "text-xs text-emerald-400" : "text-xs text-zinc-600"}>{data.walkToday ? "Done ✓" : loggingWalk ? "Saving…" : "Log"}</span>
              </button>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-sm text-zinc-300">One useful thing</span>
                <span className={usefulActionDone ? "text-xs text-emerald-400" : "text-xs text-zinc-600"}>{usefulActionDone ? "Done ✓" : "Not yet"}</span>
              </div>
            </div>
          </Card>
          <EveningResetCard completion={eveningResetCompletion} onChange={load} />
        </section>
      )}
    </div>
  );
}
