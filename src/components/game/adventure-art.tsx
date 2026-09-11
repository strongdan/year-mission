import { Campfire, Flag, Gem, Mountain, Sparkles, TentTree } from "lucide-react";
import type { GameHoliday } from "@/domain/holidays";

type Theme = "forest" | "coast" | "alpine" | "aurora";

type WeekDay = {
  date: string;
  label: string;
  isToday: boolean;
  isPast: boolean;
  holiday: GameHoliday | null;
};

export function ExplorerSprite({ moving }: { moving: boolean }) {
  return (
    <div className={moving ? "ym-explorer ym-explorer-moving" : "ym-explorer"} aria-label="Explorer character">
      <div className="ym-explorer-head">
        <div className="ym-explorer-hat" />
      </div>
      <div className="ym-explorer-pack" />
      <div className="ym-explorer-body" />
      <div className="ym-explorer-arm ym-explorer-arm-left" />
      <div className="ym-explorer-arm ym-explorer-arm-right" />
      <div className="ym-explorer-leg ym-explorer-leg-left" />
      <div className="ym-explorer-leg ym-explorer-leg-right" />
    </div>
  );
}

export function SeasonalForeground({ theme }: { theme: Theme }) {
  if (theme === "forest") {
    return <div className="pointer-events-none absolute inset-x-0 bottom-10 h-20 opacity-70" aria-hidden="true">
      {[7, 19, 33, 68, 82, 92].map((left, index) => <div key={left} className="absolute bottom-0" style={{ left: `${left}%`, transform: `scale(${0.75 + (index % 3) * 0.18})` }}>
        <div className="mx-auto h-8 w-1 bg-amber-950/80" />
        <div className="-mt-9 h-0 w-0 border-x-[13px] border-b-[25px] border-x-transparent border-b-emerald-900" />
        <div className="-mt-4 ml-1 h-0 w-0 border-x-[10px] border-b-[20px] border-x-transparent border-b-emerald-700" />
      </div>)}
    </div>;
  }
  if (theme === "coast") {
    return <div className="pointer-events-none absolute inset-x-0 bottom-10 h-16 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0 h-10 bg-cyan-400/15" />
      <div className="ym-wave absolute inset-x-0 bottom-5 h-px bg-cyan-100/50" />
      <div className="ym-wave ym-wave-delay absolute inset-x-0 bottom-2 h-px bg-white/20" />
    </div>;
  }
  if (theme === "alpine") {
    return <div className="pointer-events-none absolute inset-x-0 bottom-12 h-24 opacity-85" aria-hidden="true">
      <svg viewBox="0 0 980 110" className="h-full w-full" preserveAspectRatio="none">
        <path d="M0 110 130 24 210 94 330 8 430 98 560 22 660 100 790 12 900 90 980 52 980 110Z" fill="currentColor" className="text-slate-700" />
        <path d="M250 62 330 8 382 64 340 49 316 58 294 48Z" fill="currentColor" className="text-slate-200/70" />
        <path d="M715 58 790 12 846 66 807 53 780 60 759 49Z" fill="currentColor" className="text-slate-200/60" />
      </svg>
    </div>;
  }
  return <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div className="ym-aurora absolute left-[8%] top-5 h-16 w-[44%] -rotate-6 rounded-[50%] bg-emerald-300/15 blur-2xl" />
    <div className="ym-aurora ym-aurora-delay absolute left-[36%] top-1 h-20 w-[46%] rotate-3 rounded-[50%] bg-cyan-300/10 blur-2xl" />
    {[12, 23, 39, 57, 73, 87].map((left) => <span key={left} className="ym-star absolute top-8 h-1 w-1 rounded-full bg-white/70" style={{ left: `${left}%` }} />)}
  </div>;
}

export function HolidayScenery({ holiday }: { holiday: GameHoliday | null }) {
  if (!holiday) return null;
  if (holiday.scene === "fireworks") return <div className="pointer-events-none absolute inset-0" aria-hidden="true">
    {[24, 48, 72].map((left, index) => <div key={left} className="ym-firework absolute top-12" style={{ left: `${left}%`, animationDelay: `${index * 0.45}s` }}><Sparkles className="h-8 w-8 text-amber-200" /></div>)}
  </div>;
  if (holiday.scene === "snow" || holiday.scene === "winter") return <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    {Array.from({ length: 16 }, (_, index) => <span key={index} className="ym-snow absolute top-0 block h-1.5 w-1.5 rounded-full bg-white/70" style={{ left: `${4 + index * 6}%`, animationDelay: `${(index % 5) * 0.32}s` }} />)}
  </div>;
  if (holiday.scene === "campfire") return <div className="pointer-events-none absolute bottom-11 right-[17%] text-amber-300" aria-hidden="true"><Campfire className="h-11 w-11 drop-shadow-[0_0_12px_rgba(251,191,36,0.45)]" /></div>;
  if (holiday.scene === "alaska") return <div className="pointer-events-none absolute bottom-14 right-[12%] rounded-lg border border-sky-200/20 bg-sky-950/50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-100" aria-hidden="true">Alaska</div>;
  return <div className="pointer-events-none absolute bottom-11 right-[15%]" aria-hidden="true"><Flag className="h-10 w-10 text-white/70" /></div>;
}

export function WeeklyMiniMap({ weekDays }: { weekDays: WeekDay[] }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Weekly trail map</p>
          <p className="mt-0.5 text-xs text-zinc-400">Seven small stages. Past days stay behind you; no streak is required.</p>
        </div>
        <Mountain className="h-4 w-4 text-zinc-500" />
      </div>
      <div className="relative mt-4 grid grid-cols-7 gap-1">
        <div className="absolute left-[7%] right-[7%] top-4 h-px bg-zinc-700" aria-hidden="true" />
        {weekDays.map((day) => (
          <div key={day.date} className="relative z-10 text-center">
            <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-black ${day.isToday ? "border-amber-200 bg-amber-300 text-amber-950 shadow-lg shadow-amber-500/20" : day.isPast ? "border-emerald-600/50 bg-emerald-950 text-emerald-300" : "border-zinc-700 bg-zinc-950 text-zinc-500"}`}>
              {day.holiday ? "✦" : day.label.slice(0, 1)}
            </div>
            <p className={`mt-1 text-[9px] ${day.isToday ? "font-bold text-amber-200" : "text-zinc-600"}`}>{day.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CollectibleShelf({ xp, collectibles }: { xp: number; collectibles: Array<{ id: string; at: number; label: string; icon: "marker" | "camp" | "summit" }> }) {
  const icon = (kind: "marker" | "camp" | "summit") => kind === "camp" ? <TentTree className="h-5 w-5" /> : kind === "summit" ? <Gem className="h-5 w-5" /> : <Flag className="h-5 w-5" />;
  return (
    <div className="grid grid-cols-3 gap-2">
      {collectibles.map((item) => {
        const unlocked = xp >= item.at;
        return <div key={item.id} className={`rounded-xl border p-2.5 text-center ${unlocked ? "border-amber-500/35 bg-amber-950/20 text-amber-200" : "border-zinc-800 bg-zinc-900/50 text-zinc-600"}`}>
          <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${unlocked ? "bg-amber-300/10" : "bg-zinc-950"}`}>{icon(item.icon)}</div>
          <p className="mt-1.5 text-[10px] font-bold">{item.label}</p>
          <p className="mt-0.5 text-[9px] opacity-70">{unlocked ? "Collected" : `${item.at} XP`}</p>
        </div>;
      })}
    </div>
  );
}

export function MonthBossCard({ active, daysRemaining, title, prompt }: { active: boolean; daysRemaining: number; title: string; prompt: string }) {
  return (
    <div className={`rounded-2xl border p-3 ${active ? "border-violet-500/40 bg-gradient-to-r from-violet-950/50 to-zinc-950" : "border-zinc-800 bg-zinc-900/45"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${active ? "text-violet-300" : "text-zinc-500"}`}>{active ? "Boss encounter unlocked" : "Month gate"}</p>
          <p className="mt-1 text-sm font-black text-zinc-100">{title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">{active ? prompt : `Opens in ${Math.max(0, daysRemaining - 3)} days. This is a reflection gate, not a productivity test.`}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${active ? "border-violet-400/30 bg-violet-300/10 text-violet-200" : "border-zinc-800 bg-zinc-950 text-zinc-600"}`}><Gem className="h-5 w-5" /></div>
      </div>
    </div>
  );
}
