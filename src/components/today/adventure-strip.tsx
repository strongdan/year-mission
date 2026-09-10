"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Award, CalendarDays, Dumbbell, Flag, Footprints, Gift, HeartPulse, Moon, Sparkles, Sunrise, Trophy } from "lucide-react";
import { getAdventureAction } from "@/app/adventure-actions";
import { Card } from "@/components/ui/card";

type AdventureResult = Awaited<ReturnType<typeof getAdventureAction>>;
type AdventureData = Extract<AdventureResult, { ok: true }>["data"];

const THEME_COPY = {
  forest: { sky: "from-emerald-950 via-teal-900/80 to-sky-900", ground: "bg-emerald-950", accent: "text-emerald-200", landmark: "Evergreen Passage", orb: "bg-amber-200" },
  coast: { sky: "from-sky-800 via-cyan-700/80 to-amber-300/70", ground: "bg-cyan-950", accent: "text-cyan-100", landmark: "Wild Coast", orb: "bg-yellow-200" },
  alpine: { sky: "from-slate-800 via-indigo-900/80 to-rose-900/60", ground: "bg-slate-950", accent: "text-sky-100", landmark: "High Country", orb: "bg-orange-200" },
  aurora: { sky: "from-indigo-950 via-violet-900/80 to-emerald-900/60", ground: "bg-indigo-950", accent: "text-violet-100", landmark: "Aurora Reach", orb: "bg-cyan-100" },
} as const;

function formatDate(value: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
}

function StatPill({ icon, label }: { icon: ReactNode; label: string }) {
  return <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-2.5 py-1.5 text-[11px] text-white/80 backdrop-blur-sm">{icon}{label}</div>;
}

function ProgressMeter({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-2.5 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/55">{label}</p>
        <p className="text-xs font-bold text-white">{value}%</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-200 transition-[width] duration-500" style={{ width: `${value}%` }} />
      </div>
      <p className="mt-1.5 truncate text-[10px] text-white/45">{detail}</p>
    </div>
  );
}

function Pine({ left, scale = 1 }: { left: string; scale?: number }) {
  return (
    <div className="absolute bottom-10" style={{ left, transform: `scale(${scale})`, transformOrigin: "bottom center" }} aria-hidden="true">
      <div className="mx-auto h-8 w-1 bg-amber-950/70" />
      <div className="-mt-9 h-0 w-0 border-x-[14px] border-b-[26px] border-x-transparent border-b-emerald-900" />
      <div className="-mt-4 ml-1 h-0 w-0 border-x-[11px] border-b-[22px] border-x-transparent border-b-emerald-700" />
    </div>
  );
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
    if (!data || !scrollerRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
  const holiday = data.holiday;
  const isRestHoliday = Boolean(holiday && p.today.baseXp === 0);
  const playerLeft = `${5 + p.dayProgress * 0.9}%`;

  return (
    <Card className="overflow-hidden border-zinc-800 bg-zinc-950 p-0 shadow-2xl shadow-black/20">
      <div className={`relative overflow-hidden bg-gradient-to-r ${theme.sky} px-4 py-4 text-white`}>
        <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full border border-white/10 bg-white/5" aria-hidden="true" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">Year Mission Adventure</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black tracking-tight">{data.seasonName} Campaign</h2>
              <span className="rounded-full border border-white/15 bg-black/20 px-2 py-1 text-[10px] font-semibold text-white/70">{formatDate(data.seasonStart)}–{formatDate(data.seasonEnd)}</span>
            </div>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/70">{data.seasonObjective}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {data.seasonEmphasis.map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-medium text-white/75">{item}</span>)}
            </div>
          </div>
          <div className="rounded-2xl border border-amber-300/25 bg-black/25 px-3 py-2.5 text-right backdrop-blur-sm">
            <div className="flex items-center justify-end gap-1.5 text-amber-200"><Award className="h-4 w-4" /><span className="text-base font-black">Level {p.level}</span></div>
            <p className="mt-0.5 text-[10px] text-white/50">{p.xpIntoLevel}/{p.xpForNextLevel} XP</p>
            <p className="mt-1 text-[10px] font-semibold text-amber-100/80">{p.totalXp.toLocaleString()} lifetime XP</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px border-b border-zinc-800 bg-zinc-800 sm:grid-cols-3">
        <div className="bg-zinc-950 px-4 py-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500"><CalendarDays className="h-3.5 w-3.5" /> Current day</p>
          <p className="mt-1 text-sm font-bold text-zinc-100">{data.dayName}, {data.monthDay}</p>
          <p className="mt-0.5 text-[10px] text-zinc-600">Today&apos;s mini-level</p>
        </div>
        <div className="bg-zinc-950 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Current week</p>
          <p className="mt-1 text-sm font-bold text-zinc-100">{formatDate(data.weekStart)}–{formatDate(data.weekEnd)}</p>
          <p className="mt-0.5 text-[10px] text-zinc-600">{data.weekLabel}</p>
        </div>
        <div className="bg-zinc-950 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Current month</p>
          <p className="mt-1 text-sm font-bold text-zinc-100">{data.monthName}</p>
          <p className="mt-0.5 truncate text-[10px] text-zinc-600">{data.monthFocus ? `Quest: ${data.monthFocus}` : "Monthly chapter"}</p>
        </div>
      </div>

      {holiday && (
        <div className="border-b border-amber-400/20 bg-gradient-to-r from-amber-950/50 via-orange-950/30 to-zinc-950 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-300/25 bg-amber-300/10"><Gift className="h-5 w-5 text-amber-200" /></div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300/70">Holiday bonus level</p>
                <p className="truncate text-sm font-bold text-amber-100">{holiday.name}</p>
                <p className="text-[11px] text-zinc-400">No obligation to play. Activity earns {holiday.xpMultiplier}× XP, bonus capped at +{holiday.bonusCapXp} XP.</p>
              </div>
            </div>
            <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[11px] font-semibold text-amber-100">{isRestHoliday ? "Rest day honored" : `+${p.today.holidayBonusXp} bonus XP`}</div>
          </div>
        </div>
      )}

      <div ref={scrollerRef} className="overflow-x-auto overscroll-x-contain" aria-label="Side-scrolling daily adventure progress">
        <div className={`relative h-64 min-w-[980px] overflow-hidden bg-gradient-to-b ${theme.sky}`}>
          <div className={`absolute right-16 top-8 h-14 w-14 rounded-full ${theme.orb} opacity-80 blur-[1px]`} aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-14 h-28 opacity-70" aria-hidden="true">
            <svg viewBox="0 0 980 120" className="h-full w-full" preserveAspectRatio="none">
              <path d="M0 100 L90 48 L165 88 L260 24 L350 92 L445 36 L530 88 L640 18 L730 78 L820 36 L900 78 L980 52 L980 120 L0 120 Z" fill="currentColor" className="text-slate-700/80" />
              <path d="M0 112 L120 76 L210 103 L320 62 L420 104 L520 72 L630 100 L760 58 L860 98 L980 76 L980 120 L0 120 Z" fill="currentColor" className="text-slate-900/80" />
            </svg>
          </div>
          {data.seasonTheme === "forest" && <><Pine left="8%" scale={1.1} /><Pine left="28%" scale={0.8} /><Pine left="70%" scale={1.2} /><Pine left="88%" scale={0.9} /></>}
          {data.seasonTheme === "coast" && <div className="absolute inset-x-0 bottom-12 h-10 bg-cyan-500/15" aria-hidden="true"><div className="mt-2 h-px bg-cyan-100/30" /><div className="mt-3 h-px bg-cyan-100/20" /></div>}
          {data.seasonTheme === "aurora" && <div className="absolute left-24 top-6 h-12 w-[520px] -rotate-3 rounded-[50%] bg-emerald-300/10 blur-2xl" aria-hidden="true" />}
          <div className={`absolute inset-x-0 bottom-0 h-16 ${theme.ground}`} />
          <div className="absolute inset-x-8 bottom-12 h-2 rounded-full border border-white/5 bg-black/35 shadow-inner" />
          <div className="absolute left-8 bottom-12 h-2 rounded-full bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-200" style={{ width: `${Math.max(0, Math.min(92, p.dayProgress * 0.92))}%` }} />

          {checkpoints.map((point, index) => (
            <div key={point} className="absolute bottom-[39px]" style={{ left: `${5 + point * 0.9}%` }}>
              <div className={`flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border-2 shadow-lg ${p.dayProgress >= point ? "border-amber-200 bg-amber-400 text-amber-950" : "border-white/20 bg-zinc-900/85 text-zinc-500"}`}>{index === checkpoints.length - 1 ? <Flag className="h-3.5 w-3.5" /> : <span className="text-[8px] font-black">{point}</span>}</div>
            </div>
          ))}

          <div className="absolute bottom-[54px] transition-[left] duration-700 ease-out" style={{ left: playerLeft }}>
            <div className="relative -translate-x-1/2">
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-300/30 bg-black/70 px-2 py-1 text-[10px] font-bold text-amber-100 backdrop-blur-sm">{p.today.totalXp} XP</div>
              <div className="relative flex h-14 w-10 items-center justify-center rounded-t-[18px] rounded-b-xl border-2 border-white/70 bg-gradient-to-b from-zinc-100 to-zinc-300 text-xl shadow-xl shadow-black/40" aria-label="Player character">
                <span aria-hidden="true">🧭</span>
                <div className="absolute -bottom-1 left-0 h-2 w-3 rounded-full bg-zinc-800" /><div className="absolute -bottom-1 right-0 h-2 w-3 rounded-full bg-zinc-800" />
              </div>
            </div>
          </div>

          <div className="absolute left-5 top-4 rounded-xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">Today&apos;s level</p>
            <p className={`mt-0.5 text-base font-black ${theme.accent}`}>{holiday ? holiday.name : theme.landmark}</p>
            <p className="mt-0.5 text-[10px] text-white/45">{holiday ? "Optional festival route" : "180 XP reaches camp"}</p>
          </div>

          <div className="absolute right-5 top-4 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-right backdrop-blur-md">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">Next landmark</p>
            <p className="mt-0.5 text-xs font-bold text-white">{data.nextRewards.find((reward) => p.today.totalXp < reward.at)?.label ?? "Expedition complete"}</p>
            <p className="mt-0.5 text-[10px] text-white/45">{data.upcomingHoliday ? `${data.upcomingHoliday.name} · ${formatDate(data.upcomingHoliday.observedDate)}` : "Keep exploring"}</p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-950 px-4 py-4">
        <div className="flex flex-wrap gap-2">
          <StatPill icon={<Footprints className="h-3.5 w-3.5" />} label={`${(h?.steps ?? 0).toLocaleString()} steps`} />
          <StatPill icon={<Dumbbell className="h-3.5 w-3.5" />} label={`${h?.exercise_minutes ?? 0} exercise min`} />
          <StatPill icon={<HeartPulse className="h-3.5 w-3.5" />} label={`${h?.stand_hours ?? 0} stand hrs`} />
          <StatPill icon={<Sunrise className="h-3.5 w-3.5" />} label={data.morningCheckin ? "Morning camp +15" : "Morning camp available"} />
          <StatPill icon={<Moon className="h-3.5 w-3.5" />} label={data.eveningCheckin ? "Evening camp earned" : "Evening camp later"} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <ProgressMeter label="Day" value={p.dayProgress} detail={holiday && p.today.baseXp === 0 ? "Rest day honored" : `${p.today.totalXp}/180 XP`} />
          <ProgressMeter label="Week" value={p.weekProgress} detail={`${p.weekXp}/900 XP`} />
          <ProgressMeter label="Month" value={p.monthProgress} detail={`${p.monthXp}/3,600 XP`} />
          <ProgressMeter label="Season" value={p.seasonProgress} detail={`${p.seasonXp}/10,800 XP`} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5"><p className="text-[10px] text-zinc-500">Tasks</p><p className="mt-0.5 text-sm font-black text-zinc-100">+{p.today.taskXp} XP</p></div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5"><p className="text-[10px] text-zinc-500">Movement</p><p className="mt-0.5 text-sm font-black text-zinc-100">+{p.today.movementXp} XP</p></div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5"><p className="text-[10px] text-zinc-500">Check-ins</p><p className="mt-0.5 text-sm font-black text-zinc-100">+{p.today.checkinXp} XP</p></div>
          <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-2.5"><p className="flex items-center gap-1 text-[10px] text-amber-400/70"><Sparkles className="h-3 w-3" /> Bonus</p><p className="mt-0.5 text-sm font-black text-amber-200">+{p.today.holidayBonusXp} XP</p></div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-900/40 bg-amber-950/10 px-3 py-2.5">
          <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-[11px] leading-relaxed text-zinc-400">The map rewards living the season, not grinding it. Holidays can be zero-play rest days, missed days create no debt, and an uneven Body / Career / Self / Money radar can be exactly right.</p>
        </div>
      </div>
    </Card>
  );
}
