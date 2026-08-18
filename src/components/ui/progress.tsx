"use client";

import { cn } from "@/lib/utils";

export function ProgressBar({ value, max = 4, className }: { value: number; max?: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-zinc-800", className)}>
      <div
        className="h-full rounded-full bg-zinc-300 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function MomentumRing({ score, size = 72 }: { score: number | null; size?: number }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score === null ? 0 : Math.max(0, Math.min(100, score)) / 100;
  const color =
    score === null
      ? "stroke-zinc-700"
      : score >= 75
        ? "stroke-emerald-500"
        : score >= 50
          ? "stroke-sky-500"
          : score >= 25
            ? "stroke-amber-500"
            : "stroke-zinc-500";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className="fill-none stroke-zinc-800" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          className={cn("fill-none transition-all duration-700", color)}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-xl font-semibold text-zinc-100">{score ?? "—"}</span>
      </div>
    </div>
  );
}

export function BigFourPill({ domain, done, target }: { domain: string; done: number; target: number }) {
  const met = done >= target;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium capitalize text-zinc-300">{domain}</span>
        <span className={cn("text-[11px]", met ? "text-emerald-400" : "text-zinc-500")}>
          {done}/{target}
        </span>
      </div>
      <ProgressBar value={done} max={target} className={met ? "bg-emerald-950" : undefined} />
    </div>
  );
}