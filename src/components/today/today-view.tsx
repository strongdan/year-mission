"use client";

import { useEffect, useState } from "react";
import { getDashboardAction, checkinAction, completeTaskAction, deferTaskAction } from "@/app/actions";
import { Card, CardHeader } from "@/components/ui/card";
import { MomentumRing, BigFourPill } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw } from "lucide-react";
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

export function TodayView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deferringTask, setDeferringTask] = useState<string | null>(null);
  const [alcoholFree, setAlcoholFree] = useState<boolean | null>(null);

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

  async function toggleAlcoholFree() {
    const next = !alcoholFree;
    setAlcoholFree(next);
    await checkinAction({ alcoholFree: next });
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Today</h1>
          <p className="text-xs text-zinc-500">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={toggleAlcoholFree}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            alcoholFree ? "border-emerald-700 bg-emerald-950/60 text-emerald-300" : "border-zinc-700 text-zinc-400"
          }`}
        >
          {alcoholFree ? "Alcohol-free" : "Mark alcohol-free"}
        </button>
      </header>

      <div className="flex items-center gap-4">
        <MomentumRing score={data.momentum} />
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-200">{data.momentumLabel}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
            Momentum reflects the Big Four and meaningful completion — it recovers quickly and never punishes a bad day.
          </p>
        </div>
      </div>

      <Card className={primary ? "border-zinc-700 bg-zinc-800/60" : undefined}>
        <CardHeader title="Today's primary action" />
        {primary ? (
          <div>
            <p className="text-base font-medium text-zinc-100">{primary.title}</p>
            {primary.domain && <p className="mt-1 text-xs capitalize text-zinc-500">{primary.domain.slug}</p>}
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => completeTaskAction(primary.id).then(load)}>
                Done
              </Button>
              <Button size="sm" variant="secondary" onClick={() => deferTaskAction(primary.id, "just_avoiding").then(load)}>
                Defer
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No primary action yet. Add something to Today from the Tasks screen.</p>
        )}
      </Card>

      <Card>
        <CardHeader title="Remaining commitments" subtitle={remaining.length ? `${remaining.length} on deck` : "Nothing else today"} />
        <div className="flex flex-col gap-2">
          {remaining.map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-2 rounded-xl bg-zinc-800/50 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-200">{task.title}</p>
                <div className="mt-0.5 flex gap-2 text-[11px] text-zinc-500">
                  {task.domain && <span className="capitalize">{task.domain.slug}</span>}
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
          {remaining.length === 0 && <p className="text-sm text-zinc-500">Enjoy the breathing room.</p>}
        </div>
      </Card>

      {deferringTask && (
        <Card className="border-zinc-700">
          <CardHeader title="What's getting in the way?" />
          <div className="flex flex-wrap gap-2">
            {DEFERRAL_REASONS.map((r) => (
              <Button
                key={r.value}
                size="sm"
                variant="secondary"
                onClick={() => {
                  deferTaskAction(deferringTask, r.value).then(() => {
                    setDeferringTask(null);
                    load();
                  });
                }}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Big Four this week" />
        <div className="flex flex-col gap-3">
          {Object.entries(data.bigFour).map(([key, v]) => (
            <BigFourPill key={key} domain={key} done={v.done} target={v.target} />
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Minimum Day" subtitle="No alcohol · 10-minute walk · one useful action" right={<RotateCcw className="h-4 w-4 text-zinc-600" />} />
        <p className="text-xs leading-relaxed text-zinc-500">
          If today is overloaded or low-energy, the minimum day still counts as success. It is never a failure state.
        </p>
      </Card>

      <Button variant="secondary" className="w-full" disabled>
        <Sparkles className="h-4 w-4" />
        WHAT SHOULD I DO?
      </Button>
    </div>
  );
}