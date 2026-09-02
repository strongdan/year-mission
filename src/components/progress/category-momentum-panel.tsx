"use client";

import { useEffect, useState } from "react";
import { getDashboardAction } from "@/app/actions";
import { buildCategoryMomentum, type CategoryMomentumSeries } from "@/domain/category-momentum";
import { Card, CardHeader } from "@/components/ui/card";

const COLORS: Record<CategoryMomentumSeries["key"], { stroke: string; fill: string; badge: string }> = {
  body: { stroke: "stroke-rose-400", fill: "fill-rose-900/25", badge: "text-rose-300" },
  money: { stroke: "stroke-emerald-400", fill: "fill-emerald-900/25", badge: "text-emerald-300" },
  self: { stroke: "stroke-sky-400", fill: "fill-sky-900/25", badge: "text-sky-300" },
  capability: { stroke: "stroke-violet-400", fill: "fill-violet-900/25", badge: "text-violet-300" },
};

function Sparkline({ item }: { item: CategoryMomentumSeries }) {
  if (item.values.length < 2) {
    return <div className="flex h-14 items-center text-[11px] text-zinc-600">More evidence will make the trend visible.</div>;
  }
  const w = 150;
  const h = 48;
  const coords = item.values.map((point, index) => {
    const x = (index / (item.values.length - 1)) * (w - 8) + 4;
    const y = h - 5 - (point.score / 100) * (h - 10);
    return [x, y] as const;
  });
  const path = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${coords[coords.length - 1][0].toFixed(1)},${h - 3} L${coords[0][0].toFixed(1)},${h - 3} Z`;
  const colors = COLORS[item.key];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full" aria-label={`${item.label} momentum trend`} role="img">
      <path d={area} className={colors.fill} />
      <path d={path} className={`fill-none ${colors.stroke}`} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function directionLabel(direction: CategoryMomentumSeries["direction"]) {
  if (direction === "growing") return "Growing";
  if (direction === "holding") return "Holding";
  if (direction === "rebuilding") return "Rebuilding";
  return "Gathering data";
}

export function CategoryMomentumPanel() {
  const [series, setSeries] = useState<CategoryMomentumSeries[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDashboardAction().then((result) => {
      if (cancelled || !result.ok || !result.data) return;
      setSeries(buildCategoryMomentum(result.data.momentumHistory));
    });
    return () => { cancelled = true; };
  }, []);

  if (!series) return null;
  return (
    <Card>
      <CardHeader title="Momentum by category" subtitle="Four separate currents. A quiet week in one area does not erase movement in the others." />
      <div className="grid grid-cols-2 gap-3">
        {series.map((item) => {
          const colors = COLORS[item.key];
          const delta = item.change === null ? null : `${item.change > 0 ? "+" : ""}${item.change}`;
          return (
            <div key={item.key} className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-zinc-200">{item.label}</p>
                  <p className={`mt-0.5 text-[11px] ${colors.badge}`}>{directionLabel(item.direction)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-zinc-100">{item.current ?? "—"}</p>
                  {delta && <p className="text-[10px] text-zinc-500">{delta} / 14d</p>}
                </div>
              </div>
              <Sparkline item={item} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
