"use client";

import { useEffect, useState } from "react";
import { Activity, CalendarDays, HeartPulse, Sparkles } from "lucide-react";
import { getLifeBalanceAction } from "@/app/life-balance-actions";
import { Card, CardHeader } from "@/components/ui/card";

type LifeBalanceData = NonNullable<Awaited<ReturnType<typeof getLifeBalanceAction>>["data"]>;

function recoveryLabel(value: LifeBalanceData["recovery"]): string {
  if (value === "low") return "Lower than usual";
  if (value === "high") return "Stronger than usual";
  if (value === "typical") return "Around baseline";
  return "Not enough data";
}

export function LifeBalanceCard() {
  const [data, setData] = useState<LifeBalanceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLifeBalanceAction().then((result) => {
      if (cancelled) return;
      if (!result.ok || !result.data) {
        setError(result.error ?? "Life balance could not be loaded.");
        return;
      }
      setData(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return null;
  if (!data) {
    return (
      <Card>
        <CardHeader title="Life balance" subtitle="Looking at your week…" right={<Sparkles className="h-4 w-4 text-emerald-400" />} />
      </Card>
    );
  }

  return (
    <Card className="border-emerald-950/70 bg-emerald-950/10">
      <CardHeader
        title={data.isMonday ? "Monday reset" : "Life balance"}
        subtitle="Remember what is available to you before busyness chooses the whole week."
        right={<Sparkles className="h-4 w-4 text-emerald-400" />}
      />

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-emerald-950/60 bg-zinc-950/35 p-3">
          <div className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-zinc-200">Make room before adding more</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">{data.balancePrompt}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1">
            {data.weekShape.map((day) => (
              <div key={day.date} className="text-center">
                <p className="text-[10px] text-zinc-500">{day.label}</p>
                <div
                  className={`mt-1 rounded-md border px-1 py-1.5 text-[10px] ${
                    day.load === "busy"
                      ? "border-zinc-700 bg-zinc-800 text-zinc-300"
                      : day.load === "moderate"
                        ? "border-zinc-800 bg-zinc-900 text-zinc-400"
                        : "border-emerald-950 bg-emerald-950/30 text-emerald-300"
                  }`}
                  title={`${day.eventCount} calendar events`}
                >
                  {day.load === "open" ? "room" : day.load}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Life menu</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {data.menu.map((item) => (
              <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="text-sm font-medium text-zinc-200">{item.label}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{item.hint}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-zinc-600">These are options, not commitments. Pick one only when it would make the week better.</p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-sky-400" />
              <p className="text-xs font-medium text-zinc-300">Movement</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">{data.movementCopy}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-3.5 w-3.5 text-rose-400" />
              <p className="text-xs font-medium text-zinc-300">Recovery · {recoveryLabel(data.recovery)}</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">{data.recoveryCopy}</p>
          </div>
        </div>

        {!data.healthConnected && (
          <p className="text-[11px] leading-relaxed text-zinc-600">
            Apple Health sync is not active yet. Once the iPhone companion sends HealthKit summaries, this card will use steps, active energy, exercise minutes, stand hours, HRV, resting heart rate, and sleep without turning them into a fake precision score.
          </p>
        )}
      </div>
    </Card>
  );
}
