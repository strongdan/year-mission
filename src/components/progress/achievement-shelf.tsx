"use client";

import { useEffect, useState } from "react";
import { Award, Flame, Gem, LockKeyhole, RotateCcw, Shield, Sparkles, Trophy } from "lucide-react";
import { getAchievementsAction } from "@/app/game-actions";
import { Card, CardHeader } from "@/components/ui/card";

type AchievementResult = Awaited<ReturnType<typeof getAchievementsAction>>;
type Achievement = Extract<AchievementResult, { ok: true }>["data"][number];

function iconFor(id: Achievement["id"]) {
  if (id === "first_spark") return Flame;
  if (id === "four_corners") return Shield;
  if (id === "courage") return Sparkles;
  if (id === "comeback") return RotateCcw;
  if (id === "weekly_win") return Trophy;
  if (id === "milestone") return Gem;
  return Award;
}

export function AchievementShelf() {
  const [items, setItems] = useState<Achievement[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAchievementsAction().then((result) => {
      if (!cancelled && result.ok) setItems(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!items) return null;
  const earned = items.filter((item) => item.earned).length;

  return (
    <Card>
      <CardHeader
        title="Mission badges"
        subtitle={`${earned} of ${items.length} earned · permanent proof, not a streak`}
        right={<Award className="h-4 w-4 text-amber-400" />}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((item) => {
          const Icon = iconFor(item.id);
          const pct = Math.min(100, Math.round((item.progress / item.target) * 100));
          return (
            <div
              key={item.id}
              className={`rounded-xl border p-3 ${item.earned ? "border-amber-900/60 bg-amber-950/15" : "border-zinc-800 bg-zinc-950/25"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${item.earned ? "bg-amber-900/35 text-amber-300" : "bg-zinc-900 text-zinc-600"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                {!item.earned && <LockKeyhole className="h-3.5 w-3.5 text-zinc-700" />}
              </div>
              <p className={`mt-2 text-xs font-semibold ${item.earned ? "text-zinc-100" : "text-zinc-400"}`}>{item.title}</p>
              <p className="mt-1 min-h-8 text-[10px] leading-relaxed text-zinc-600">{item.description}</p>
              {item.earned ? (
                <p className="mt-2 text-[10px] font-medium text-amber-400">Unlocked</p>
              ) : (
                <div className="mt-2">
                  <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-zinc-600" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] tabular-nums text-zinc-700">{item.progress}/{item.target}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 border-t border-zinc-800 pt-3 text-[10px] leading-relaxed text-zinc-600">Badges unlock from real evidence: meaningful work, breadth, courage, returning, Weekly Wins, and milestones. They never disappear.</p>
    </Card>
  );
}
