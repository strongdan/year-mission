"use client";

import { useEffect, useState } from "react";
import { getDashboardAction } from "@/app/actions";
import { Card, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";

type DashboardData = Awaited<ReturnType<typeof getDashboardAction>>["data"];

export function ProgressView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDashboardAction().then((res) => {
      if (cancelled) return;
      if (!res.ok) setError(res.error ?? "Failed to load.");
      else if (res.data) setData(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <div className="p-4 text-sm text-zinc-400">{error}</div>;
  if (!data) return <div className="p-4 text-sm text-zinc-500">Loading…</div>;

  const latestDebt = data.financial[0]?.consumer_debt ?? null;
  const weight = data.todayCheckin?.weight ?? null;

  return (
    <div className="flex flex-col gap-4 p-4">
      <header>
        <h1 className="text-xl font-semibold">Progress</h1>
        <p className="text-xs text-zinc-500">Evidence of change, not a leaderboard.</p>
      </header>

      <Card>
        <CardHeader title="Momentum" subtitle={data.momentumLabel} />
        <div className="flex items-end gap-3">
          <span className="text-4xl font-semibold">{data.momentum ?? "—"}</span>
          <span className="pb-1 text-sm text-zinc-500">/ 100</span>
        </div>
        <ProgressBar value={data.momentum ?? 0} max={100} className="mt-3" />
      </Card>

      <Card>
        <CardHeader title="Reliability" subtitle="Do I do what I say I will do?" />
        <div className="flex items-end gap-3">
          <span className="text-4xl font-semibold">{data.reliability ?? "—"}</span>
          <span className="pb-1 text-sm text-zinc-500">%</span>
        </div>
        {data.reliability !== null && <p className="mt-2 text-xs leading-relaxed text-zinc-500">{data.reliabilityInterpretation}</p>}
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-zinc-400">
          <span className="rounded-full bg-zinc-800 px-2 py-1">Agency: {data.agency}</span>
        </div>
      </Card>

      <Card>
        <CardHeader title="Domains" />
        <div className="grid grid-cols-2 gap-3">
          {data.domains.map((d) => (
            <div key={d.id} className="rounded-xl bg-zinc-800/50 p-3">
              <p className="text-sm font-medium capitalize">{d.slug}</p>
              <p className="mt-1 text-[11px] capitalize text-zinc-500">{d.current_level}</p>
              <ProgressBar value={d.progress_score} max={100} className="mt-2" />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Key metrics" />
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-zinc-800/50 p-3">
            <p className="text-xs text-zinc-500">Consumer debt</p>
            <p className="mt-1 font-medium">{latestDebt === null ? "—" : `$${latestDebt.toLocaleString()}`}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 p-3">
            <p className="text-xs text-zinc-500">Weight</p>
            <p className="mt-1 font-medium">{weight === null ? "—" : `${weight} lb`}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 p-3">
            <p className="text-xs text-zinc-500">Workouts this week</p>
            <p className="mt-1 font-medium">{data.workouts.length}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 p-3">
            <p className="text-xs text-zinc-500">Active experiments</p>
            <p className="mt-1 font-medium">{data.experiments.filter((e) => e.status === "active").length}</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Milestones" />
        {data.milestones.length > 0 ? (
          <div className="flex flex-col gap-2">
            {data.milestones.slice(0, 8).map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-zinc-200">{m.title}</span>
                <span className="shrink-0 text-xs text-zinc-500">{m.achieved_at}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No milestones yet. They&apos;ll appear as you make real-world progress.</p>
        )}
      </Card>

      <Card>
        <CardHeader title="Recent evidence" />
        {data.evidence.length > 0 ? (
          <div className="flex flex-col gap-2">
            {data.evidence.slice(0, 8).map((e) => (
              <div key={e.id} className="flex items-start justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-zinc-200">{e.title}</p>
                  <p className="text-[11px] capitalize text-zinc-500">{e.type}</p>
                </div>
                <span className="shrink-0 text-xs text-zinc-600">{e.occurred_at}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Complete courage tasks and hard things to build evidence.</p>
        )}
      </Card>
    </div>
  );
}