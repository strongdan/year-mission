"use client";

import { useEffect, useState } from "react";
import { getDashboardAction } from "@/app/actions";
import { seasonGrowthFrame } from "@/domain/season-growth";
import { seasonTheme } from "@/domain/season-theme";
import { Card } from "@/components/ui/card";

export function SeasonProgressCard() {
  const [seasonName, setSeasonName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDashboardAction().then((result) => {
      if (!cancelled && result.ok && result.data) setSeasonName(result.data.season?.name ?? null);
    });
    return () => { cancelled = true; };
  }, []);

  if (!seasonName) return null;
  const theme = seasonTheme(seasonName);
  const frame = seasonGrowthFrame(seasonName);

  return (
    <Card className={`${theme.border} bg-gradient-to-br ${theme.gradient}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${theme.text}`}>
              {theme.number ? `Season ${theme.number}` : "Current season"}
            </p>
          </div>
          <h2 className="mt-1 text-lg font-semibold text-zinc-100">{frame.label}</h2>
          <p className={`mt-1 text-xs ${theme.text}`}>{theme.metaphor}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-zinc-300">{frame.purpose}</p>
      <div className={`mt-3 rounded-lg border ${theme.border} ${theme.soft} px-3 py-2`}>
        <p className="text-[11px] uppercase tracking-wide text-zinc-500">Season cue</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-300">{theme.cue}</p>
      </div>
    </Card>
  );
}
