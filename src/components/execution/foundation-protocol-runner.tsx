"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, Check, Pause, Play, RotateCcw } from "lucide-react";
import { logExecutionAction } from "@/app/execution-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FOUNDATION_PROTOCOLS, type FoundationProtocolSlug } from "@/domain/foundational-protocols";
import { localDateFromSystemClock } from "@/domain/local-calendar";
import { formatClock, useCountdown } from "./use-countdown";

export function FoundationProtocolRunner({ slug }: { slug: FoundationProtocolSlug }) {
  const protocol = FOUNDATION_PROTOCOLS[slug];
  const [stepIndex, setStepIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number | null>(null);
  const step = protocol.steps[stepIndex];
  const totalSeconds = protocol.steps.reduce((sum, item) => sum + item.durationSeconds, 0);

  const timer = useCountdown(step.durationSeconds, () => {
    if (stepIndex < protocol.steps.length - 1) {
      setStepIndex((value) => value + 1);
    } else {
      void finish(true);
    }
  });

  function start() {
    startedAt.current = Date.now();
    setStarted(true);
    timer.reset(step.durationSeconds, true);
  }

  function reset() {
    setStarted(false);
    setStepIndex(0);
    startedAt.current = null;
    timer.reset(protocol.steps[0].durationSeconds, false);
  }

  async function finish(completedProtocol = false) {
    if (saving || finished) return;
    setSaving(true);
    setError(null);
    const startTime = startedAt.current ?? Date.now();
    const elapsed = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const result = await logExecutionAction({
      protocolId: protocol.slug,
      kind: "routine",
      durationSeconds: completedProtocol ? totalSeconds : Math.min(totalSeconds, elapsed),
      taskId: null,
      date: localDateFromSystemClock(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      details: { completedProtocol, evidenceLabel: protocol.evidenceLabel },
    });
    if (!result.ok) {
      setError(result.error ?? "Could not save this protocol.");
      setSaving(false);
      return;
    }
    setFinished(true);
    setSaving(false);
  }

  if (finished) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950 text-emerald-300"><Check className="h-7 w-7" /></div>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">{protocol.title} complete</h1>
          <p className="mt-1 max-w-xs text-sm leading-relaxed text-zinc-500">Recorded. No score, streak, or extra reflection required.</p>
        </div>
        <Link href="/"><Button>Back to Today</Button></Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <Link href="/execute" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200">
        <ArrowLeft className="h-3.5 w-3.5" /> Routines
      </Link>

      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-400/80">Foundation · {protocol.evidenceLabel}</p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight text-zinc-100">{protocol.title}</h1>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">{protocol.purpose}</p>
      </header>

      <Card className="flex min-h-[360px] flex-col items-center justify-center border-emerald-900/50 bg-emerald-950/10 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-300">{step.title}</p>
        <p className="mt-3 text-7xl font-semibold tabular-nums tracking-tight text-zinc-100">
          {formatClock(started ? timer.secondsLeft : step.durationSeconds)}
        </p>
        <p className="mt-5 max-w-xs text-sm leading-relaxed text-zinc-500">{step.cue}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {!started ? (
            <Button onClick={start}><Play className="mr-1.5 h-4 w-4" /> Begin</Button>
          ) : (
            <>
              <Button onClick={timer.toggle}>
                {timer.running ? <><Pause className="mr-1.5 h-4 w-4" /> Pause</> : <><Play className="mr-1.5 h-4 w-4" /> Resume</>}
              </Button>
              <Button variant="secondary" onClick={() => void finish(false)} disabled={saving}>End here</Button>
            </>
          )}
        </div>
      </Card>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/25 p-3">
        {protocol.safetyNote && <p className="text-xs leading-relaxed text-zinc-400">{protocol.safetyNote}</p>}
        <a
          className="mt-2 inline-block text-[11px] text-zinc-600 underline decoration-zinc-800 underline-offset-2 hover:text-zinc-300"
          href={protocol.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Evidence note: {protocol.sourceLabel}
        </a>
      </div>

      {started && (
        <button onClick={reset} className="mx-auto inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-300">
          <RotateCcw className="h-3 w-3" /> Restart
        </button>
      )}
      {error && <p className="rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
