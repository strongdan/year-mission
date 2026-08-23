"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { logExecutionAction } from "@/app/execution-actions";
import { MOBILITY_PROTOCOLS } from "@/domain/execution-protocols";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatClock, useCountdown } from "./use-countdown";

export function MobilityRunner({ slug, taskId, onComplete }: { slug: string; taskId?: string | null; onComplete?: () => void }) {
  const protocol = MOBILITY_PROTOCOLS[slug];
  const [stepIndex, setStepIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(Date.now());

  const step = protocol?.steps[stepIndex];
  const timer = useCountdown(step?.durationSeconds ?? 0, () => {
    if (!protocol || !step) return;
    if (stepIndex < protocol.steps.length - 1) {
      const nextIndex = stepIndex + 1;
      setStepIndex(nextIndex);
      window.setTimeout(() => timer.reset(protocol.steps[nextIndex].durationSeconds, true), 0);
      if ("vibrate" in navigator) navigator.vibrate?.(80);
    } else {
      void finish();
    }
  });

  if (!protocol || !step) return <div className="p-4 text-sm text-zinc-400">Mobility protocol not found.</div>;

  async function finish() {
    if (saving || finished) return;
    setSaving(true);
    const result = await logExecutionAction({
      protocolId: protocol.slug,
      kind: "mobility",
      durationSeconds: Math.max(30, Math.round((Date.now() - startedAt.current) / 1000)),
      taskId: taskId ?? null,
      details: { completedSteps: protocol.steps.length },
    });
    if (!result.ok) {
      setError(result.error ?? "Could not save mobility session.");
      setSaving(false);
      return;
    }
    setFinished(true);
    setSaving(false);
    onComplete?.();
  }

  function start() {
    startedAt.current = Date.now();
    setStarted(true);
    timer.reset(step.durationSeconds, true);
  }

  function skipStep() {
    if (stepIndex >= protocol.steps.length - 1) {
      void finish();
      return;
    }
    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);
    timer.reset(protocol.steps[nextIndex].durationSeconds, started);
  }

  if (finished) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950 text-emerald-300"><Check className="h-7 w-7" /></div>
        <div><h1 className="text-2xl font-semibold text-zinc-100">Mobility complete</h1><p className="mt-1 text-sm text-zinc-500">You followed the sequence. Nothing else to decide.</p></div>
        {!onComplete && <Link href="/"><Button>Back to Today</Button></Link>}
      </div>
    );
  }

  const progress = Math.round(((stepIndex + (timer.secondsLeft === 0 && !started ? 0 : 1)) / protocol.steps.length) * 100);

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      {!onComplete && <Link href="/execute" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200"><ArrowLeft className="h-3.5 w-3.5" /> Routines</Link>}
      <header><h1 className="text-2xl font-semibold text-zinc-100">{protocol.title}</h1><p className="mt-1 text-xs text-zinc-500">{stepIndex + 1} of {protocol.steps.length} · guided transitions</p></header>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-900"><div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${progress}%` }} /></div>

      <Card className="flex min-h-[330px] flex-col items-center justify-center border-violet-900/60 bg-violet-950/15 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-violet-400/80">Current movement</p>
        <h2 className="mt-4 text-2xl font-semibold text-zinc-50">{step.title}</h2>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">{step.cue}</p>
        <p className="mt-8 text-6xl font-semibold tabular-nums tracking-tight text-zinc-100">{formatClock(started ? timer.secondsLeft : step.durationSeconds)}</p>
        <div className="mt-7 flex gap-2">
          {!started ? <Button onClick={start}><Play className="mr-1.5 h-4 w-4" /> Start</Button> : <Button onClick={timer.toggle}>{timer.running ? <><Pause className="mr-1.5 h-4 w-4" /> Pause</> : <><Play className="mr-1.5 h-4 w-4" /> Resume</>}</Button>}
          <Button variant="secondary" onClick={skipStep}>Next <ChevronRight className="ml-1 h-4 w-4" /></Button>
        </div>
      </Card>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/25 px-3 py-3">
        <p className="text-xs text-zinc-600">Next</p>
        <p className="mt-1 text-sm text-zinc-300">{protocol.steps[stepIndex + 1]?.title ?? "Finish"}</p>
      </div>

      <button onClick={() => { setStepIndex(0); setStarted(false); timer.reset(protocol.steps[0].durationSeconds, false); startedAt.current = Date.now(); }} className="mx-auto inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-300"><RotateCcw className="h-3 w-3" /> Restart sequence</button>
      {error && <p className="rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
