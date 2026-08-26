"use client";

import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";
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

function plantStageLabel(stage: DomainGrowth["stage"]): string {
  if (stage === "seed") return "Seed";
  if (stage === "sprout") return "Sprout";
  if (stage === "growing") return "Growing";
  if (stage === "rooted") return "Rooted";
  return "Flourishing";
}

function Plant({ score, label }: { score: number; label: string }) {
  const stemTop = 72 - Math.max(8, Math.round(score * 0.52));
  const leafCount = score >= 85 ? 6 : score >= 60 ? 5 : score >= 35 ? 4 : score >= 15 ? 2 : 0;
  const leaves = Array.from({ length: leafCount }, (_, index) => {
    const y = Math.max(stemTop + 8, 62 - index * 8);
    const right = index % 2 === 0;
    return { y, right };
  });
  return (
    <svg viewBox="0 0 80 86" role="img" aria-label={`${label} growth ${score} percent`} className="h-24 w-full max-w-[88px]">
      <path d="M15 76 C28 70 52 70 65 76" className="fill-none stroke-zinc-700" strokeWidth="3" strokeLinecap="round" />
      {score < 15 ? (
        <ellipse cx="40" cy="70" rx="5" ry="3.5" className="fill-amber-700/70" />
      ) : (
        <>
          <path d={`M40 70 C39 56 41 42 40 ${stemTop}`} className="fill-none stroke-emerald-700" strokeWidth="3" strokeLinecap="round" />
          {leaves.map((leaf, index) => (
            <ellipse
              key={`${leaf.y}-${index}`}
              cx={leaf.right ? 49 : 31}
              cy={leaf.y}
              rx={10}
              ry={5}
              transform={`rotate(${leaf.right ? -28 : 28} ${leaf.right ? 49 : 31} ${leaf.y})`}
              className={score >= 60 ? "fill-emerald-500/75" : "fill-emerald-700/70"}
            />
          ))}
          {score >= 85 && <circle cx="40" cy={stemTop} r="7" className="fill-emerald-400/80" />}
        </>
      )}
    </svg>
  );
}

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
      <CardHeader title="Mission growth" subtitle="This week shows balance. The garden shows durable evidence of change." right={<Leaf className="h-4 w-4 text-emerald-500" />} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">This week&apos;s shape</p>
          <BalanceRadar bigFour={bigFour} />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">Mission garden</p>
          <div className="grid grid-cols-2 gap-2">
            {(growth ?? DOMAIN_ORDER.map((slug) => ({ slug, label: LABELS[slug], score: 0, stage: "seed", points: 0, meaningfulActions: 0, comebacks: 0 }) as DomainGrowth)).map((item) => (
              <div key={item.slug} className="rounded-xl border border-zinc-800 bg-zinc-900/35 px-2 py-2 text-center">
                <Plant score={item.score} label={item.label} />
                <p className="text-xs font-medium text-zinc-300">{item.label}</p>
                <p className="mt-0.5 text-[10px] text-zinc-600">{plantStageLabel(item.stage)} · {item.score}%</p>
                {item.comebacks > 0 && <p className="mt-1 text-[10px] text-emerald-500">{item.comebacks} comeback{item.comebacks === 1 ? "" : "s"}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-4 border-t border-zinc-800 pt-3 text-[11px] leading-relaxed text-zinc-600">Self growth is evidence, not affirmation: courage, returning after avoidance, learning from friction, and doing things the old version of you would have avoided. Plants never wilt because a hard day is not lost progress.</p>
    </Card>
  );
}
