"use client";

import { useEffect, useState } from "react";
import { getMissionGrowthAction, type DomainGrowth } from "@/app/growth-actions";
import { Card, CardHeader } from "@/components/ui/card";

interface WeeklyValue {
  done: number;
  target: number;
}

interface Props {
  bigFour: Record<string, WeeklyValue>;
}

const DOMAIN_ORDER = ["body", "capability", "home", "money"] as const;
const LABELS: Record<(typeof DOMAIN_ORDER)[number], string> = {
  body: "Body",
  capability: "Career",
  home: "Self",
  money: "Money",
};

function BalanceRadar({ bigFour }: { bigFour: Record<string, WeeklyValue> }) {
  const cx = 90;
  const cy = 88;
  const radius = 58;
  const value = (slug: string) => {
    const item = bigFour[slug];
    if (!item || item.target <= 0) return 0;
    return Math.max(0, Math.min(1, item.done / item.target));
  };
  const coordinates = DOMAIN_ORDER.map((slug, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI / 2);
    const r = radius * value(slug);
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  });
  const polygon = coordinates.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const guide = [0.5, 1].map((fraction) => DOMAIN_ORDER.map((_, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI / 2);
    return `${(cx + Math.cos(angle) * radius * fraction).toFixed(1)},${(cy + Math.sin(angle) * radius * fraction).toFixed(1)}`;
  }).join(" "));

  return (
    <div>
      <svg viewBox="0 0 180 180" role="img" aria-label="This week's Big Four balance" className="mx-auto w-full max-w-[230px]">
        {guide.map((points, index) => <polygon key={points} points={points} className="fill-none stroke-zinc-800" strokeWidth={index === 0 ? 1 : 1.5} />)}
        <line x1={cx} y1="30" x2={cx} y2="146" className="stroke-zinc-800" strokeWidth="1" />
        <line x1="32" y1={cy} x2="148" y2={cy} className="stroke-zinc-800" strokeWidth="1" />
        <polygon points={polygon} className="fill-sky-500/15 stroke-sky-400" strokeWidth="2" strokeLinejoin="round" />
        {coordinates.map(([x, y], index) => <circle key={DOMAIN_ORDER[index]} cx={x} cy={y} r="3.3" className="fill-sky-300" />)}
        <text x="90" y="16" textAnchor="middle" className="fill-zinc-400 text-[10px]">Body</text>
        <text x="165" y="91" textAnchor="end" className="fill-zinc-400 text-[10px]">Career</text>
        <text x="90" y="171" textAnchor="middle" className="fill-zinc-400 text-[10px]">Self</text>
        <text x="15" y="91" className="fill-zinc-400 text-[10px]">Money</text>
      </svg>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-zinc-600">
        {DOMAIN_ORDER.map((slug) => {
          const item = bigFour[slug];
          return <div key={slug} className="flex justify-between"><span>{LABELS[slug]}</span><span>{item ? `${Math.min(item.done, item.target)}/${item.target}` : "0/1"}</span></div>;
        })}
      </div>
    </div>
  );
}

function DurableEvidence({ growth }: { growth: DomainGrowth[] | null }) {
  if (!growth) {
    return <p className="text-xs leading-relaxed text-zinc-500">Durable progress appears after meaningful actions accumulate.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {growth.map((item) => (
        <div key={item.slug} className="rounded-xl border border-zinc-800 bg-zinc-900/35 p-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-medium text-zinc-300">{item.label}</p>
            <span className="text-sm font-semibold tabular-nums text-zinc-200">{item.score}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${item.score}%` }} />
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-zinc-600">
            {item.meaningfulActions} completed task/workout{item.meaningfulActions === 1 ? "" : "s"}
            {item.comebacks > 0 ? ` · ${item.comebacks} comeback${item.comebacks === 1 ? "" : "s"}` : ""}
          </p>
        </div>
      ))}
    </div>
  );
}

export function MissionGrowth({ bigFour }: Props) {
  const [growth, setGrowth] = useState<DomainGrowth[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMissionGrowthAction().then((result) => {
      if (!cancelled && result.ok && result.data) setGrowth(result.data);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <Card>
      <CardHeader title="Mission growth" subtitle="This week shows balance. Durable evidence shows what has accumulated without a streak to protect." />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">This week&apos;s shape</p>
          <BalanceRadar bigFour={bigFour} />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">Durable evidence</p>
          <DurableEvidence growth={growth} />
        </div>
      </div>
      <p className="mt-4 border-t border-zinc-800 pt-3 text-[11px] leading-relaxed text-zinc-600">
        Progress is evidence of meaningful action, learning, and returning after a gap. A hard day does not erase what already happened.
      </p>
    </Card>
  );
}
