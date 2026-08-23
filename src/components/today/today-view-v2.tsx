"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Moon } from "lucide-react";
import {
  checkinAction,
  completeTaskAction,
  getDashboardAction,
  logWorkoutAction,
} from "@/app/actions";
import { Card } from "@/components/ui/card";
import type { EveningResetCompletion } from "@/domain/evening-reset";
import { executionLaunchForTask } from "@/domain/execution-protocols";
import { DailyAdviceCue } from "@/components/advice/daily-advice-cue";
import { EveningResetCard } from "./evening-reset-card";
import { NextCalendarEvent } from "./next-calendar-event";
import { ResistancePanel } from "./resistance-panel";
import { WhatShouldIDo } from "./what-should-i-do";

type DashboardData = Awaited<ReturnType<typeof getDashboardAction>>["data"];

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

function genericStartHref(task: { id: string; estimated_minutes?: number | null }): string {
  const minutes = Math.max(5, Math.min(10, task.estimated_minutes ?? 10));
  return `/execute/focus?minutes=${minutes}&taskId=${encodeURIComponent(task.id)}`;
}

export function TodayViewV2() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resistingTask, setResistingTask] = useState<string | null>(null);
  const [alcoholFree, setAlcoholFree] = useState<boolean | null>(null);
  const [loggingWalk, setLoggingWalk] = useState(false);

  async function load() {
    const result = await getDashboardAction();
    if (!result.ok || !result.data) {
      setError(result.error ?? "Failed to load.");
      setLoading(false);
      return;
    }
    setData(result.data);
    setAlcoholFree(result.data.todayCheckin?.alcohol_free ?? false);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    getDashboardAction().then((result) => {
      if (cancelled) return;
      if (!result.ok || !result.data) {
        setError(result.error ?? "Failed to load.");
        setLoading(false);
        return;
      }
      setData(result.data);
      setAlcoholFree(result.data.todayCheckin?.alcohol_free ?? false);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="p-4 text-sm text-zinc-500">Loading…</div>;
  if (error || !data) return <div className="p-4 text-sm text-zinc-400">{error ?? "No data."}</div>;

  const now = new Date();
  const isEvening = now.getHours() >= 17;
  const primary = data.todayTasks[0];
  const remaining = data.todayTasks.slice(1);
  const primaryLaunch = primary ? executionLaunchForTask(primary) : null;
  const primaryHref = primary ? primaryLaunch?.href ?? genericStartHref(primary) : null;
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
    if (loggingWalk || data.walkToday) return;
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
          <p className="mt-0.5 text-xs text-zinc-500">{now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
          <p className="mt-1 text-xs text-zinc-400">{isEvening ? "Close the day, then leave it behind." : "See the next move, start it, then leave the app."}</p>
        </div>
        <button onClick={toggleAlcoholFree} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${alcoholFree ? "border-emerald-700 bg-emerald-950/60 text-emerald-300" : "border-zinc-700 text-zinc-400"}`}>{alcoholFree ? "Alcohol-free ✓" : "Alcohol-free"}</button>
      </header>

      {(data.season || data.monthlyFocus) && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/35 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2"><span className={`h-2 w-2 shrink-0 rounded-full ${seasonMeta?.dot ?? "bg-zinc-500"}`} /><p className="truncate text-xs text-zinc-400"><span className={`font-semibold ${seasonMeta?.text ?? "text-zinc-300"}`}>{seasonMeta ? `Season ${seasonMeta.number} · ` : ""}{data.season?.name ?? "Year Mission"}</span>{data.monthlyFocus ? ` · ${monthName}: ${data.monthlyFocus.title}` : ` · ${monthName}`}</p></div>
          <Link href="/settings" className="shrink-0 text-[11px] text-zinc-600 hover:text-zinc-300">Timeline</Link>
        </div>
      )}

      {primary && primaryHref ? (
        <Card className="border-sky-800/70 bg-gradient-to-br from-sky-950/45 to-zinc-900/65">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-400/80">Do this next</p>
          <p className="mt-2 text-xl font-semibold leading-snug text-zinc-50">{primary.title}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-400">
            {primary.domain && <span>{domainLabel(primary.domain.slug)}</span>}
            {primaryLaunch?.detail ? <span>{primaryLaunch.detail}</span> : primary.estimated_minutes ? <span>{primary.estimated_minutes} min</span> : null}
            {primary.defer_count > 0 && <span className="text-orange-300">Deferred ×{primary.defer_count}</span>}
          </div>
          <Link href={primaryHref} className="mt-4 flex w-full items-center justify-between rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-white"><span>{primaryLaunch?.label ?? "Start for 10 minutes"}</span><ArrowRight className="h-4 w-4" /></Link>
          <div className="mt-2 flex items-center justify-between gap-3">
            <button onClick={() => setResistingTask(resistingTask === primary.id ? null : primary.id)} className="text-xs text-zinc-500 underline-offset-4 hover:text-zinc-200 hover:underline">I don&apos;t feel like doing this</button>
            <button onClick={() => completeTaskAction(primary.id).then(load)} className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-emerald-400"><Check className="h-3.5 w-3.5" /> Already done</button>
          </div>
        </Card>
      ) : (
        <WhatShouldIDo onChange={load} />
      )}

      {primary && resistingTask === primary.id && <ResistancePanel task={primary} onChange={load} onClose={() => setResistingTask(null)} />}

      <NextCalendarEvent />

      <Card>
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold text-zinc-200">Later today</p><p className="mt-0.5 text-[11px] text-zinc-500">{remaining.length ? `${remaining.length} thing${remaining.length === 1 ? "" : "s"} after the current action` : "Nothing else committed"}</p></div><Link href="/tasks" className="text-xs text-zinc-500 hover:text-zinc-200">Manage</Link></div>
        {remaining.length > 0 && <div className="mt-3 divide-y divide-zinc-800/80">{remaining.map((task) => <div key={task.id} className="flex items-center gap-3 py-2.5"><button onClick={() => completeTaskAction(task.id).then(load)} aria-label={`Complete ${task.title}`} className="h-5 w-5 shrink-0 rounded-full border border-zinc-700 text-[11px] text-zinc-700 transition-colors hover:border-emerald-500 hover:text-emerald-400">✓</button><div className="min-w-0 flex-1"><p className="truncate text-sm text-zinc-300">{task.title}</p><p className="mt-0.5 text-[11px] text-zinc-600">{[task.domain ? domainLabel(task.domain.slug) : null, task.estimated_minutes ? `${task.estimated_minutes} min` : null].filter(Boolean).join(" · ")}</p></div></div>)}</div>}
      </Card>

      <Card className="bg-zinc-900/35">
        <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-zinc-200">This week</p><p className="mt-0.5 text-[11px] text-zinc-500">{protectedAreas} of 4 areas protected</p></div><Link href="/progress" className="text-xs text-zinc-500 hover:text-zinc-200">Progress</Link></div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">{bigFourEntries.map(([key, value]) => { const met = value.done >= value.target; return <div key={key} className="flex items-center justify-between gap-2 text-xs"><span className="text-zinc-400">{BIG_FOUR_LABELS[key] ?? key}</span><span className={met ? "text-emerald-400" : "text-zinc-600"}>{met ? "✓" : `${value.done}/${value.target}`}</span></div>; })}</div>
        {data.weeklyWin && <div className="mt-3 border-t border-zinc-800 pt-2.5"><p className="text-[11px] text-zinc-500">Weekly Win</p><p className="mt-0.5 truncate text-sm text-amber-100">{data.weeklyWin.title}</p></div>}
      </Card>

      <DailyAdviceCue />

      {isEvening && (
        <section className="mt-1 flex flex-col gap-3">
          <div><h2 className="text-base font-semibold text-zinc-100">Close the day</h2><p className="mt-0.5 text-xs text-zinc-500">Use the minimum version if capacity is gone.</p></div>
          <Card>
            <div className="divide-y divide-zinc-800/80">
              <button onClick={toggleAlcoholFree} className="flex w-full items-center justify-between gap-3 py-2.5 text-left"><span className="text-sm text-zinc-300">Alcohol-free</span><span className={alcoholFree ? "text-xs text-emerald-400" : "text-xs text-zinc-600"}>{alcoholFree ? "Done ✓" : "Mark"}</span></button>
              <button onClick={logWalk} disabled={loggingWalk || data.walkToday} className="flex w-full items-center justify-between gap-3 py-2.5 text-left disabled:opacity-80"><span className="text-sm text-zinc-300">10-minute walk</span><span className={data.walkToday ? "text-xs text-emerald-400" : "text-xs text-zinc-600"}>{data.walkToday ? "Done ✓" : loggingWalk ? "Saving…" : "Log"}</span></button>
              <div className="flex items-center justify-between gap-3 py-2.5"><span className="text-sm text-zinc-300">One useful thing</span><span className={usefulActionDone ? "text-xs text-emerald-400" : "text-xs text-zinc-600"}>{usefulActionDone ? "Done ✓" : "Not yet"}</span></div>
            </div>
          </Card>
          <Link href="/execute/evening-reset" className="flex items-center justify-between rounded-xl border border-indigo-900/60 bg-indigo-950/20 px-4 py-3 text-sm font-medium text-indigo-100"><span className="inline-flex items-center gap-2"><Moon className="h-4 w-4 text-indigo-400" /> Start Evening Reset</span><span className="text-xs text-indigo-400">Stretch → meditate → hypnosis</span></Link>
          <EveningResetCard completion={eveningResetCompletion} onChange={load} />
        </section>
      )}
    </div>
  );
}
