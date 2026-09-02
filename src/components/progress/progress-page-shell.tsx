"use client";

import Link from "next/link";
import { ProgressView } from "./progress-view";
import { ProgressGrowthPanel } from "./progress-growth-panel";
import { SeasonProgressCard } from "./season-progress-card";
import { CategoryMomentumPanel } from "./category-momentum-panel";

export function ProgressPageShell() {
  return (
    <div>
      <div className="px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <header>
            <h1 className="text-xl font-semibold text-zinc-100">Progress</h1>
            <p className="text-xs text-zinc-500">Evidence of change, not a leaderboard.</p>
          </header>
          <Link href="/advice" className="text-xs text-zinc-500 hover:text-zinc-200">Advice</Link>
        </div>
      </div>
      <div className="flex flex-col gap-4 px-4 pt-4">
        <SeasonProgressCard />
        <CategoryMomentumPanel />
      </div>
      <div className="pt-4"><ProgressGrowthPanel /></div>
      <div className="[&>div>header:first-child]:hidden [&>div]:pt-0">
        <ProgressView />
      </div>
    </div>
  );
}
