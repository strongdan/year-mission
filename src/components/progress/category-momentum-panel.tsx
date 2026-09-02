"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Gauge, Minus } from "lucide-react";
import { getCategoryMomentumAction } from "@/app/momentum-actions";
import { Card, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import type { CategoryMomentum, CategoryMomentumRelative, CategoryMomentumTrend } from "@/domain/momentum";
import type { DomainSlug } from "@/domain/constants";

const CATEGORY_LABELS: Record<DomainSlug, string> = {
  body: "Body",
  money: "Money",
  home: "Self",
  capability: "Career",
};

function formatUnits(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1).replace(/\.0$/, "");
}

function relativeCopy(relative: CategoryMomentumRelative | null, delta: number | null): string {
  if (relative === null || delta === null) return "No comparison yet";
  const signed = delta > 0 ? `+${delta}` : String(delta);
  if (relative === "leading") return `Leading your mix · ${signed}`;
  if (relative === "quieter") return `Quieter than your mix · ${signed}`;
  return `Near your average · ${signed}`;
}

function trendMeta(trend: CategoryMomentumTrend) {
  if (trend === "rising") return { label: "Picking up", Icon: ArrowUpRight, className: "text-emerald-400" };
  if (trend === "quieter") return { label: "Quieter this week", Icon: ArrowDownRight, className: "text-amber-400" };
  return { label: "Holding", Icon: Minus, className: "text-zinc-500" };
}

export function CategoryMomentumPanel() {
  const [items, setItems] = useState<CategoryMomentum[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getCategoryMomentumAction().then((result) => {
      if (cancelled) return;
      if (!result.ok || !result.data) {
        setError(result.error ?? "Category momentum could not be loaded.");
        return;
      }
      setItems(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="px-4">
        <Card>
          <CardHeader title="Momentum by category" subtitle="Short-term movement across the Big Four." right={<Gauge className="h-4 w-4 text-zinc-500" />} />
          <p className="text-xs text-zinc-500">{error}</p>
        </Card>
      </div>
    );
  }

  if (!items) {
    return (
      <div className="px-4">
        <Card>
          <CardHeader title="Momentum by category" subtitle="Reading the last two rolling weeks…" right={<Gauge className="h-4 w-4 text-zinc-500" />} />
          <div className="h-20 animate-pulse rounded-xl bg-zinc-900/70" />
        </Card>
      </div>
    );
  }

  const hasSignal = items.some((item) => item.score !== null);

  return (
    <div className="px-4">
      <Card>
        <CardHeader
          title="Momentum by category"
          subtitle="Relative to your own recent mix — not a leaderboard or streak."
          right={<Gauge className="h-4 w-4 text-sky-400" />}
        />

        {!hasSignal ? (
          <p className="text-sm leading-relaxed text-zinc-500">
            There is not enough recent activity to compare yet. A few meaningful completions or logged workouts will start the signal.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => {
              const trend = trendMeta(item.trend);
              const TrendIcon = trend.Icon;
              return (
                <div key={item.slug} className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">{CATEGORY_LABELS[item.slug]}</p>
                      <div className={`mt-0.5 inline-flex items-center gap-1 text-[11px] ${trend.className}`}>
                        <TrendIcon className="h-3 w-3" />
                        {trend.label}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold tabular-nums text-zinc-100">{item.score ?? "—"}</p>
                      <p className="text-[10px] text-zinc-600">/ 100</p>
                    </div>
                  </div>

                  <ProgressBar value={item.score ?? 0} max={100} className="mt-2.5" />

                  <div className="mt-2 flex items-end justify-between gap-3">
                    <p className="text-[11px] text-zinc-500">
                      {relativeCopy(item.relative, item.deltaFromAverage)}
                    </p>
                    <p className="shrink-0 text-[10px] text-zinc-600">
                      {formatUnits(item.recentUnits)} recent · {formatUnits(item.previousUnits)} prior · floor {item.weeklyTarget}/wk
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
          The latest seven days carry 72% of the signal and the seven before them carry 28%, so one quiet week does not erase prior movement and one useful rep can start rebuilding immediately.
        </p>
      </Card>
    </div>
  );
}
