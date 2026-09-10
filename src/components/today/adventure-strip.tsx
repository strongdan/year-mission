"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Award, Dumbbell, Footprints, HeartPulse, Moon, Sunrise, Trophy } from "lucide-react";
import { getAdventureAction } from "@/app/adventure-actions";
import { Card } from "@/components/ui/card";

type AdventureResult = Awaited<ReturnType<typeof getAdventureAction>>;
type AdventureData = Extract<AdventureResult, { ok: true }>["data"];

const THEME_COPY = {
  forest: { sky: "from-emerald-950/50 via-sky-950/30 to-zinc-950", ground: "bg-emerald-950/70", landmark: "Evergreen Passage" },
  coast: { sky: "from-sky-950/60 via-cyan-950/25 to-zinc-950", ground: "bg-cyan-950/50", landmark: "Wild Coast" },
  alpine: { sky: "from-slate-800/70 via-sky-950/30 to-zinc-950", ground: "bg-slate-800/80", landmark: "High Country" },
  aurora: { sky: "from-violet-950/55 via-emerald-950/25 to-zinc-950", ground: "bg-violet-950/50", landmark: "Aurora Reach" },
} as const;

function percent(value: number) {
  return `${Math.max(3, Math.min(97, value))}%`;
}

function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/60 px-2.5 py-1.5 text-[11px] text-zinc-300">{icon}{label}</div>;
}

export function AdventureStrip() {
  const [data, setData] = useState<AdventureData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdventureAction().then((result) => {
      if (cancelled) return;
      if (!result.ok || !result.data) setError(result.error ?? "Adventure could not be loaded.");
      else setData(result.data);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!data || !scrollerRef.current) return;
    const node = scrollerRef.current;
    const max = Math.max(0, node.scrollWidth - node.clientWidth);
    node.scrollTo({ left: max * (data.progress.dayProgress / 100), behavior: "smooth" });
  }, [data]);

  const checkpoints = useMemo(() => [0, 18, 36, 54, 72, 88, 100], []);

  if (error) return null;
  if (!data) return <Card><p className="text-xs text-zinc-500">Loading today&apos;s adventure…</p></Card>;

  const theme = THEME_COPY[data.seasonTheme];
  const p = data.progress;
  const h = data.todayHealth;

  return (
    <Card className="overflow-hidden border-zinc-800 p-0">
      <div className="border-b border-zinc-800 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Year Mission Adventure</p>
            <h2 className="mt-1 text-base font-semibold text-zinc-100">{data.seasonName} · {data.monthName}</h2>
            <p className="mt-0.5 text-xs text-zinc-500">{data.monthFocus ?? data.seasonObjective ?? data.weekLabel}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-amber-300"><Award className="h-4 w-4" /><span className="text-sm font-semibold">Level {p.level}</span></div>
            <p className="mt-0.5 text-[10px] text-zinc-600">{p.xpIntoLevel}/{p.xpForNextLevel} XP to next level</p>
          </div>
        </div>
      </div>

      <div ref={scrollerRef} className="overflow-x-auto overscroll-x-contain" aria-label="Side-scrolling daily adventure progress">
        <div className={`relative h-48 min-w-[900px] overflow-hidden bg-gradient-to-b ${theme.sky}`}>
          <div className="absolute inset-x-0 bottom-12 h-16 opacity-50">
            <svg viewBox="0 0 900 80" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 70 L90 30 L160 64 L250 18 L330 58 L430 22 L520 62 L620 12 L710 58 L810 25 L900 66 L900 80 L0 80 Z" fill="currentColor" className="text-zinc-700" />
            </svg>
          </div>
          <div className={`absolute inset-x-0 bottom-0 h-14 ${theme.ground}`} />
          <div className="absolute inset-x-8 bottom-9 h-1 rounded-full bg-zinc-700" />

          {checkpoints.map((point, index) => (
            <div key={point} className="absolute bottom-[31px]" style={{ left: `${5 + point * 0.9}%` }}>
              <div className={`h-4 w-4 -translate-x-1/2 rounded-full border-2 ${p.dayProgress >= point ? "border-amber-300 bg-amber-400" : "border-zinc-600 bg-zinc-900"}`} />
              {index > 0 && index < checkpoints.length - 1 && <span className="absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap text-[9px] text-zinc-600">{point}%</span>}
            </div>
          ))}

          <div className="absolute bottom-[35px] transition-[left] duration-700 ease-out" style={{ left: percent(5 + p.dayProgress * 0.9) }}>
            <div className="relative -translate-x-1/2">
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-500/40 bg-zinc-950/90 px-2 py-0.5 text-[10px] font-semibold text-amber-300">{p.today.totalXp} XP</div>
              <div className="flex h-10 w-8 items-center justify-center rounded-t-full rounded-b-lg border border-zinc-400 bg-zinc-200 text-lg shadow-lg" aria-label="You">🧭</div>
            </div>
          </div>

          <div className="absolute left-5 top-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-3 py-2 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Today&apos;s mini-level</p>
            <p className="mt-0.5 text-sm font-semibold text-zinc-100">{theme.landmark}</p>
          </div>

          <div className="absolute right-5 top-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-3 py-2 text-right backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Finish line</p>
            <p className="mt-0.5 text-xs text-zinc-300">180 XP = day camp</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <StatPill icon={<Footprints className="h-3.5 w-3.5" />} label={`${(h?.steps ?? 0).toLocaleString()} steps`} />
          <StatPill icon={<Dumbbell className="h-3.5 w-3.5" />} label={`${h?.exercise_minutes ?? 0} exercise min`} />
          <StatPill icon={<HeartPulse className="h-3.5 w-3.5" />} label={`${h?.stand_hours ?? 0} stand hrs`} />
          <StatPill icon={<Sunrise className="h-3.5 w-3.5" />} label={data.morningCheckin ? "Morning check-in +15" : "Morning check-in available"} />
          <StatPill icon={<Moon className="h-3.5 w-3.5" />} label={data.eveningCheckin ? "Evening reset earned" : "Evening reset later"} />
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          {[
            ["Day", p.dayProgress],
            ["Week", p.weekProgress],
            ["Month", p.monthProgress],
            ["Season", p.seasonProgress],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg bg-zinc-900/70 px-2 py-2">
              <p className="text-[10px] text-zinc-500">{label}</p>
              <p className="mt-0.5 text-xs font-semibold text-zinc-200">{value}%</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-zinc-800 p-2"><p className="text-[10px] text-zinc-500">Tasks</p><p className="mt-0.5 text-sm font-semibold text-zinc-200">+{p.today.taskXp} XP</p></div>
          <div className="rounded-lg border border-zinc-800 p-2"><p className="text-[10px] text-zinc-500">Movement</p><p className="mt-0.5 text-sm font-semibold text-zinc-200">+{p.today.movementXp} XP</p></div>
          <div className="rounded-lg border border-zinc-800 p-2"><p className="text-[10px] text-zinc-500">Check-ins</p><p className="mt-0.5 text-sm font-semibold text-zinc-200">+{p.today.checkinXp} XP</p></div>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-900/40 bg-amber-950/10 px-3 py-2.5">
          <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-[11px] leading-relaxed text-zinc-400">XP rewards movement, meaningful tasks, and brief check-ins. There is no streak penalty, no lost progress, and no reason to grind after the day already feels lived.</p>
        </div>
      </div>
    </Card>
  );
}
