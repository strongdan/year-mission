"use client";

import Link from "next/link";
import { useMemo } from "react";
import { dailyAdvice, ADVICE_CATEGORY_LABELS } from "@/domain/advice";

export function DailyAdviceCue() {
  const advice = useMemo(() => dailyAdvice(new Date()), []);
  return (
    <div className="border-t border-zinc-900 pt-2 text-xs leading-relaxed text-zinc-500">
      <span className="font-medium text-zinc-400">Today&apos;s cue:</span>{" "}
      {advice.body}{" "}
      <Link href={`/advice?category=${advice.category}`} className="whitespace-nowrap text-zinc-600 underline-offset-4 hover:text-zinc-300 hover:underline">
        {ADVICE_CATEGORY_LABELS[advice.category]}
      </Link>
    </div>
  );
}
