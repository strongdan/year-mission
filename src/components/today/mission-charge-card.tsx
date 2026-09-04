"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Flame, RotateCcw, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { getGameLoopAction } from "@/app/game-actions";
import { Card } from "@/components/ui/card";

type GameLoopResult = Awaited<ReturnType<typeof getGameLoopAction>>;
type GameLoopData = Extract<GameLoopResult, { ok: true }>["data"];

function tierCopy(tier: GameLoopData["charge"]["tier"]): string {
  if (tier === "full_charge") return "Full charge. The useful move now is to leave the app and enjoy the result.";
  if (tier === "day_won") return "The day already counts. Anything else is bonus.";
  if (tier === "in_motion") return "You have traction. One more meaningful move can turn this into a won day.";
  if (tier === "ignited") return "The engine is on. Keep the chain small and useful.";
  return "One meaningful action is enough to ignite the day.";
}

function chargeTone(charge: number): string {
  if (charge >= 80) return "from-emerald-500 to-sky-400";
  if (charge >= 50) return "from-sky-500 to-violet-400";
  if (charge >= 20) return "from-amber-500 to-sky-400";
  return "from-zinc-700 to-zinc-600";
}

export function MissionChargeCard() {
  const [data, setData] = useState<GameLoopData | null>(null);

  const load = useCallback(async () => {
    const result = await getGameLoopAction();
    if (result.ok && result.data) setData(result.data);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    const onFocus = () => void load();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  if (!data) return null;

  const { charge, comeback, bonusMission } = data;
  const allProtected = charge.protectedAreas >= 4;

  return (
    <Card className="overflow-hidden border-zinc-800 bg-gradient-to-br from-zinc-900/90 to-zinc-950/75">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            <Zap className="h-3 w-3" /> Mission charge
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-zinc-50">{charge.charge}</span>
            <span className="text-xs text-zinc-600">/ 100</span>
          </div>
        </div>
        <div className="rounded-full border border-zinc-700 bg-zinc-950/50 px-2.5 py-1 text-xs font-semibold text-zinc-200">
          {charge.label}
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ${chargeTone(charge.charge)}`}
          style={{ width: `${charge.charge}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-zinc-500">
        <span>{charge.meaningfulActions} meaningful action{charge.meaningfulActions === 1 ? "" : "s"} today</span>
        {charge.nextTarget !== null ? <span>{charge.pointsToNext} to {charge.nextTarget}</span> : <span>Maxed</span>}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-zinc-300">{tierCopy(charge.tier)}</p>

      {comeback.active && (
        <div className="mt-3 flex gap-2 rounded-xl border border-emerald-900/60 bg-emerald-950/20 px-3 py-2.5">
          <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <div>
            <p className="text-xs font-semibold text-emerald-300">Comeback unlocked</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-100/65">You returned after {comeback.quietDays} quiet day{comeback.quietDays === 1 ? "" : "s"}. Recovery is progress; nothing was lost.</p>
          </div>
        </div>
      )}

      {allProtected ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-sky-900/60 bg-sky-950/20 px-3 py-2.5">
          <ShieldCheck className="h-4 w-4 shrink-0 text-sky-400" />
          <div>
            <p className="text-xs font-semibold text-sky-200">Big Four shield complete</p>
            <p className="mt-0.5 text-[11px] text-sky-100/60">All four areas are protected this week. No extra grinding required.</p>
          </div>
        </div>
      ) : bonusMission ? (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-violet-900/50 bg-violet-950/15 px-3 py-2.5">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-400"><Sparkles className="h-3 w-3" /> Bonus mission</p>
            <p className="mt-1 text-xs font-medium text-zinc-200">Protect {bonusMission.label}</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">{bonusMission.done}/{bonusMission.target} meaningful actions this week</p>
          </div>
          <Link href="/tasks" className="shrink-0 text-[11px] font-medium text-violet-300 hover:text-violet-200">Choose move</Link>
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-1.5 border-t border-zinc-800 pt-2.5 text-[10px] text-zinc-600">
        <Flame className="h-3 w-3" /> No streak to protect · meta-work earns nothing · garden growth stays permanent
      </div>
    </Card>
  );
}
