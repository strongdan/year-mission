"use client";

import { useState } from "react";
import { whatShouldIDoAction, startTaskAction, deferTaskAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import type { DeferralReason } from "@/domain/constants";
import type { EnergyLevel } from "@/domain/sequencing";

const TIME_CHIPS = [10, 20, 30, 60] as const;

const ENERGY_CHIPS: { value: EnergyLevel; label: string }[] = [
  { value: "low", label: "Low energy" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High energy" },
];

const DEFERRAL_REASONS: { value: DeferralReason; label: string }[] = [
  { value: "too_big", label: "Too big" },
  { value: "dont_know_how", label: "Don't know how" },
  { value: "no_energy", label: "No energy" },
  { value: "not_important", label: "Not important" },
  { value: "blocked", label: "Blocked" },
  { value: "just_avoiding", label: "Just avoiding it" },
];

type WsidData = NonNullable<Awaited<ReturnType<typeof whatShouldIDoAction>>["data"]>;

export function WhatShouldIDo({ onChange }: { onChange?: () => void }) {
  const [minutes, setMinutes] = useState<number | null>(null);
  const [energy, setEnergy] = useState<EnergyLevel | null>(null);
  const [result, setResult] = useState<WsidData | null>(null);
  const [busy, setBusy] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [deferring, setDeferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(excludeTaskId?: string) {
    setBusy(true);
    setError(null);
    setShowWhy(false);
    setDeferring(false);
    const res = await whatShouldIDoAction({
      availableMinutes: minutes,
      energy,
      excludeTaskId: excludeTaskId ?? null,
    });
    setBusy(false);
    if (!res.ok || !res.data) {
      setError(res.error ?? "No recommendation available right now.");
      setResult(null);
      return;
    }
    setResult(res.data);
  }

  async function start() {
    if (!result || result.result.kind !== "task") return;
    await startTaskAction(result.result.task.task.id);
    setResult(null);
    onChange?.();
  }

  async function defer(reason: DeferralReason) {
    if (!result || result.result.kind !== "task") return;
    await deferTaskAction(result.result.task.task.id, reason);
    setResult(null);
    setDeferring(false);
    onChange?.();
  }

  const recommendation = result?.result.kind === "task" ? result.result.task : null;

  return (
    <Card className="border-zinc-700">
      <CardHeader title="What should I do now?" subtitle="One recommendation, grounded in your current state." />

      {!result && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">Time</span>
            {TIME_CHIPS.map((m) => (
              <button
                key={m}
                onClick={() => setMinutes(minutes === m ? null : m)}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  minutes === m ? "border-zinc-300 bg-zinc-100 text-zinc-950" : "border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">Energy</span>
            {ENERGY_CHIPS.map((e) => (
              <button
                key={e.value}
                onClick={() => setEnergy(energy === e.value ? null : e.value)}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  energy === e.value ? "border-zinc-300 bg-zinc-100 text-zinc-950" : "border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
          <Button onClick={() => ask()} disabled={busy}>
            <Sparkles className="h-4 w-4" />
            {busy ? "Thinking…" : "Recommend"}
          </Button>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}

      {result?.result.kind === "task" && recommendation && (
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-base font-medium text-zinc-100">{recommendation.task.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
              {recommendation.task.domain && <span className="capitalize">{recommendation.task.domain.slug}</span>}
              {recommendation.task.estimated_minutes && <span>{recommendation.task.estimated_minutes}m</span>}
              {recommendation.task.defer_count > 0 && <span className="text-orange-400">Deferred ×{recommendation.task.defer_count}</span>}
              {recommendation.task.courage_task && <span className="text-amber-400">Uncomfortable but important</span>}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">{recommendation.reasons[0]?.label}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={start}>
              Start
            </Button>
            <Button size="sm" variant="secondary" onClick={() => ask(recommendation.task.id)} disabled={busy}>
              Something else
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDeferring(true)}>
              I don&apos;t want to do this
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowWhy(!showWhy)}>
              Why this?
            </Button>
          </div>

          {showWhy && (
            <ul className="flex flex-col gap-1.5 rounded-xl bg-zinc-950/60 p-3">
              {recommendation.reasons.map((r, i) => (
                <li key={i} className="text-xs leading-relaxed text-zinc-400">
                  · {r.label}
                </li>
              ))}
            </ul>
          )}

          {deferring && (
            <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 p-3">
              <p className="text-xs font-medium text-zinc-300">What&apos;s getting in the way?</p>
              <div className="flex flex-wrap gap-1.5">
                {DEFERRAL_REASONS.map((r) => (
                  <Button key={r.value} size="sm" variant="secondary" onClick={() => defer(r.value)}>
                    {r.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {result?.result.kind === "floor" && (
        <div className="flex flex-col gap-3">
          <p className="text-base font-medium text-zinc-100">{result.result.label}</p>
          <p className="text-xs leading-relaxed text-zinc-400">{result.result.reason}</p>
          <p className="text-[11px] text-zinc-500">A floor keeps the day moving without a full commitment.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setResult(null)}>
              Got it
            </Button>
            <Button size="sm" variant="ghost" onClick={() => ask()} disabled={busy}>
              Something else
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}