"use client";

import { useEffect, useState } from "react";
import {
  getDashboardAction,
  checkinAction,
  completeTaskAction,
  deferTaskAction,
  logWorkoutAction,
} from "@/app/actions";
import { Card, CardHeader } from "@/components/ui/card";
import { MomentumRing } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  BriefcaseBusiness,
  Check,
  Dumbbell,
  Flag,
  Footprints,
  House,
  WalletCards,
} from "lucide-react";
import { WhatShouldIDo } from "./what-should-i-do";
import { EveningResetCard } from "./evening-reset-card";
import { WeekSchedule } from "./week-schedule";
import type { DeferralReason } from "@/domain/constants";

type DashboardData = Awaited<ReturnType<typeof getDashboardAction>>["data"];

const DEFERRAL_REASONS: { value: DeferralReason; label: string }[] = [
  { value: "too_big", label: "Too big" },
  { value: "dont_know_how", label: "Don't know how" },
  { value: "no_energy", label: "No energy" },
  { value: "not_important", label: "Not important" },
  { value: "blocked", label: "Blocked" },
  { value: "just_avoiding", label: "Just avoiding it" },
];

const SEASON_META: Record<
  string,
  { number: number; border: string; background: string; text: string; muted: string }
> = {
  stabilize: {
    number: 1,
    border: "border-sky-900/70",
    background: "bg-gradient-to-br from-sky-950/55 via-zinc-900/70 to-zinc-900/50",
    text: "text-sky-200",
    muted: "text-sky-400/70",
  },
  build: {
    number: 2,
    border: "border-emerald-900/70",
    background: "bg-gradient-to-br from-emerald-950/55 via-zinc-900/70 to-zinc-900/50",
    text: "text-emerald-200",
    muted: "text-emerald-400/70",
  },
  transform: {
    number: 3,
    border: "border-violet-900/70",
    background: "bg-gradient-to-br from-violet-950/55 via-zinc-900/70 to-zinc-900/50",
    text: "text-violet-200",
    muted: "text-violet-400/70",
  },
  convert: {
    number: 4,
    border: "border-amber-900/70",
    background: "bg-gradient-to-br from-amber-950/50 via-zinc-900/70 to-zinc-900/50",
    text: "text-amber-200",
    muted: "text-amber-400/70",
  },
};

const BIG_FOUR_META = {
  body: {
    title: "Body",
    detail: "2 workouts · walk toward 10k/day average · alcohol-free",
    Icon: Dumbbell,
    border: "border-sky-900/60",
    icon: "text-sky-400",
    track: "bg-sky-500",
  },
  money: {
    title: "Money",
    detail: "15-minute money review · avoid new consumer debt",
    Icon: WalletCards,
    border: "border-emerald-900/60",
    icon: "text-emerald-400",
    track: "bg-emerald-500",
  },
  home: {
    title: "Home",
    detail: "1 focused house block · create visible sell-ready progress",
    Icon: House,
    border: "border-amber-900/60",
    icon: "text-amber-400",
    track: "bg-amber-500",
  },
  capability: {
    title: "Career",
    detail: "1 focused technical/career block · create evidence, not just study",
    Icon: BriefcaseBusiness,
    border: "border-violet-900/60",
    icon: "text-violet-400",
    track: "bg-violet-500",
  },
} as const;

function domainLabel(slug?: string | null): string {
  if (!slug) return "";
  if (slug === "capability") return "Career";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
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

  if (loading) {
    return <div className="p-4 text-sm text-zinc-500">Loading…</div>;
  }

  if (error || !data) {
    return (
      <div className="p-4 text-sm text-zinc-400">
        {error ?? "No data."} {!error && "Sign in to view your mission."}
      </div>
    );
  }

  const primary = data.todayTasks[0];
  const remaining = data.todayTasks.slice(1);
  const usefulActionDone = data.completedToday.length > 0;
  const now = new Date();
  const monthName = now.toLocaleDateString(undefined, { month: "long" });
  const seasonKey = data.season?.name.toLowerCase() ?? "";
  const seasonMeta = SEASON_META[seasonKey];

  async function toggleAlcoholFree() {
    const next = !alcoholFree;
    setAlcoholFree(next);
    await checkinAction({ alcoholFree: next });
  }

  async function logWalk() {
    if (loggingWalk || data?.walkToday) return;
    setLoggingWalk(true);
    await logWorkoutAction({ type: "walking", durationMinutes: 10 });
    setLoggingWalk(false);
    load();
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Today</h1>
          <p className="text-xs text-zinc-500">
            {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={toggleAlcoholFree}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            alcoholFree
              ? "border-emerald-700 bg-emerald-950/60 text-emerald-300"
              : "border-zinc-700 text-zinc-400"
          }`}
        >
          {alcoholFree ? "Alcohol-free" : "Mark alcohol-free"}
        </button>
      </header>

      {(data.season || data.monthlyFocus) && (
        <Card
          className={`${seasonMeta?.border ?? "border-zinc-800"} ${
            seasonMeta?.background ?? "bg-zinc-900/50"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${seasonMeta?.muted ?? "text-zinc-500"}`}>
                {seasonMeta ? `Season ${seasonMeta.number} of 4` : "Current season"}
              </p>
              <h2 className={`mt-1 text-lg font-semibold ${seasonMeta?.text ?? "text-zinc-100"}`}>
                {data.season?.name ?? "Year Mission"}
              </h2>
              {data.season?.objective && (
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{data.season.objective}</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-zinc-100">{monthName}</p>
              {data.monthlyFocus && <p className="mt-0.5 max-w-[125px] text-xs text-zinc-400">{data.monthlyFocus.title}</p>}
            </div>
          </div>
        </Card>
      )}

      <Card className="border-sky-900/60 bg-gradient-to-br from-sky-950/35 to-zinc-900/60">
        <CardHeader title="Do this next" subtitle="The clearest current commitment — start here before browsing the rest." />
        {primary ? (
          <div>
            <p className="text-lg font-semibold leading-snug text-zinc-50">{primary.title}</p>
            <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-zinc-400">
              {primary.domain && <span>{domainLabel(primary.domain.slug)}</span>}
              {primary.estimated_minutes && <span>{primary.estimated_minutes} min</span>}
              {primary.defer_count > 0 && <span className="text-orange-300">Deferred ×{primary.defer_count}</span>}
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => completeTaskAction(primary.id).then(load)}>
                Done
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setDeferringTask(deferringTask === primary.id ? null : primary.id)}
              >
                I&apos;m avoiding this
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-zinc-400">
            Nothing is committed to Today yet. Use the recommendation below or choose one task from This Week.
          </p>
        )}
      </Card>

      {deferringTask === primary?.id && (
        <Card className="border-orange-900/50 bg-orange-950/10">
          <CardHeader title="What's getting in the way?" />
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

      <WhatShouldIDo onChange={load} />

      {data.weeklyWin && (
        <Card className="border-amber-900/50 bg-amber-950/10">
          <CardHeader
            title="Weekly Win"
            subtitle="If only one substantial thing gets finished this week, make it this."
            right={<Flag className="h-4 w-4 text-amber-400" />}
          />
          <p className="text-sm font-medium text-amber-100">{data.weeklyWin.title}</p>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Big Four this week"
          subtitle="The minimum viable week across the four outcomes that matter."
        />
        <div className="flex flex-col gap-2.5">
          {Object.entries(data.bigFour).map(([key, value]) => {
            const meta = BIG_FOUR_META[key as keyof typeof BIG_FOUR_META];
            if (!meta) return null;
            const pct = value.target > 0 ? Math.min(100, (value.done / value.target) * 100) : 0;
            const matchingTasks = data.weeklyCommitments
              .filter((task) => task.domain?.slug === key)
              .slice(0, 2);
            const met = value.done >= value.target;
            const Icon = meta.Icon;

            return (
              <div key={key} className={`rounded-xl border ${meta.border} bg-zinc-950/25 px-3 py-3`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-zinc-900 p-2">
                    <Icon className={`h-4 w-4 ${meta.icon}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-zinc-200">{meta.title}</p>
                      <span className={`text-xs font-medium tabular-nums ${met ? "text-emerald-400" : "text-zinc-500"}`}>
                        {value.done}/{value.target}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">{meta.detail}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div className={`h-full rounded-full ${meta.track} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    {matchingTasks.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1">
                        {matchingTasks.map((task) => (
                          <p key={task.id} className="truncate text-[11px] text-zinc-400">
                            · {task.title}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <WeekSchedule />

      <div className="flex items-center gap-4 px-1 py-1">
        <MomentumRing score={data.momentum} />
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-200">Momentum: {data.momentumLabel}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
            Meaningful completion matters more than a perfect day. Momentum can recover quickly.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Also today"
          subtitle={remaining.length ? `${remaining.length} other commitment${remaining.length === 1 ? "" : "s"}` : "Nothing else today"}
        />
        <div className="flex flex-col gap-2">
          {remaining.map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-2 rounded-xl bg-zinc-800/50 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-200">{task.title}</p>
                <div className="mt-0.5 flex gap-2 text-[11px] text-zinc-500">
                  {task.domain && <span>{domainLabel(task.domain.slug)}</span>}
                  {task.estimated_minutes && <span>{task.estimated_minutes}m</span>}
                  {task.courage_task && <span className="text-amber-400">Uncomfortable but important</span>}
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => completeTaskAction(task.id).then(load)}>
                  Done
                </Button>
                <button
                  onClick={() => setDeferringTask(deferringTask === task.id ? null : task.id)}
                  className="rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-800"
                >
                  Defer
                </button>
              </div>
            </div>
          ))}
          {remaining.length === 0 && <p className="text-sm text-zinc-500">Good. Keep the day small.</p>}
        </div>
      </Card>

      {deferringTask && deferringTask !== primary?.id && (
        <Card className="border-zinc-700">
          <CardHeader title="What's getting in the way?" />
          <div className="flex flex-wrap gap-2">
            {DEFERRAL_REASONS.map((reason) => (
              <Button
                key={reason.value}
                size="sm"
                variant="secondary"
                onClick={() => {
                  deferTaskAction(deferringTask, reason.value).then(() => {
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

      <EveningResetCard
        completion={(data.todayCheckin?.evening_reset_completion as "target" | "floor" | "skipped" | null) ?? null}
        onChange={load}
      />

      <Card>
        <CardHeader title="Minimum Day" subtitle="No alcohol · 10-minute walk · one useful action" />
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-zinc-800/50 px-3 py-2.5">
            <span className="text-sm text-zinc-300">No alcohol</span>
            {alcoholFree ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                <Check className="h-3.5 w-3.5" /> Done
              </span>
            ) : (
              <Button size="sm" variant="secondary" onClick={toggleAlcoholFree}>
                Mark
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl bg-zinc-800/50 px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm text-zinc-300">
              <Footprints className="h-4 w-4 text-zinc-500" /> 10-minute walk
            </span>
            {data.walkToday ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                <Check className="h-3.5 w-3.5" /> Done
              </span>
            ) : (
              <Button size="sm" variant="secondary" onClick={logWalk} disabled={loggingWalk}>
                {loggingWalk ? "Logging…" : "Log walk"}
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl bg-zinc-800/50 px-3 py-2.5">
            <span className="text-sm text-zinc-300">One useful action</span>
            {usefulActionDone ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                <Check className="h-3.5 w-3.5" /> Done
              </span>
            ) : (
              <span className="text-xs text-zinc-500">Complete one task</span>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-zinc-500">
          If today is overloaded or low-energy, the minimum day still counts as success. It is never a failure state.
        </p>
      </Card>
    </div>
  );
}
