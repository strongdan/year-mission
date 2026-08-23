"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, Check, Pause, Play, RotateCcw } from "lucide-react";
import { logExecutionAction } from "@/app/execution-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatClock, useCountdown } from "./use-countdown";

type MeditationMode = "breath" | "silent" | "body_scan";

const MODE_COPY: Record<MeditationMode, { label: string; cue: string }> = {
  breath: { label: "Breath", cue: "Let the breath be natural. When attention wanders, return to the next breath." },
  silent: { label: "Silent", cue: "Nothing to accomplish. Notice what is present and begin again whenever attention drifts." },
  body_scan: { label: "Body scan", cue: "Move attention slowly through the body. Notice sensation without needing to change it." },
};

export function MeditationRunner({ initialMinutes = 5, taskId, onComplete }: { initialMinutes?: number; taskId?: string | null; onComplete?: () => void }) {
  const safeInitial = [5, 10, 20].includes(initialMinutes) ? initialMinutes : 5;
  const [minutes, setMinutes] = useState(safeInitial);
  const [mode, setMode] = useState<MeditationMode>("breath");
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number | null>(null);
  const timer = useCountdown(minutes * 60, () => void finish(true));

  async function finish(completedTimer = false) {
    if (saving || finished) return;
    setSaving(true);
    const startTime = startedAt.current ?? Date.now();
    const elapsed = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const result = await logExecutionAction({
      protocolId: `meditation-${minutes}`,
      kind: "meditation",
      durationSeconds: completedTimer ? minutes * 60 : Math.min(minutes * 60, elapsed),
      taskId: taskId ?? null,
      details: { mode, completedTimer },
    });
    if (!result.ok) {
      setError(result.error ?? "Could not save meditation.");
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
    timer.reset(minutes * 60, true);
  }

  function chooseMinutes(next: number) {
    if (started) return;
    setMinutes(next);
    timer.reset(next * 60, false);
  }

  if (finished) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950 text-emerald-300"><Check className="h-7 w-7" /></div>
        <div><h1 className="text-2xl font-semibold text-zinc-100">Meditation complete</h1><p className="mt-1 text-sm text-zinc-500">Recorded. No reflection required.</p></div>
        {!onComplete && <Link href="/"><Button>Back to Today</Button></Link>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      {!onComplete && <Link href="/execute" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200"><ArrowLeft className="h-3.5 w-3.5" /> Routines</Link>}
      <header><h1 className="text-2xl font-semibold text-zinc-100">Meditation</h1><p className="mt-1 text-xs text-zinc-500">One timer. No library to browse before starting.</p></header>

      {!started && (
        <div className="flex gap-2">
          {[5, 10, 20].map((value) => <button key={value} onClick={() => chooseMinutes(value)} className={`flex-1 rounded-xl border px-3 py-2.5 text-sm ${minutes === value ? "border-sky-700 bg-sky-950/30 text-sky-200" : "border-zinc-800 text-zinc-500"}`}>{value} min</button>)}
        </div>
      )}

      <Card className="flex min-h-[370px] flex-col items-center justify-center border-sky-900/50 bg-sky-950/10 text-center">
        <p className="text-7xl font-semibold tabular-nums tracking-tight text-zinc-100">{formatClock(started ? timer.secondsLeft : minutes * 60)}</p>
        <p className="mt-5 max-w-xs text-sm leading-relaxed text-zinc-500">{MODE_COPY[mode].cue}</p>
        <div className="mt-8 flex gap-2">
          {!started ? <Button onClick={start}><Play className="mr-1.5 h-4 w-4" /> Begin</Button> : <Button onClick={timer.toggle}>{timer.running ? <><Pause className="mr-1.5 h-4 w-4" /> Pause</> : <><Play className="mr-1.5 h-4 w-4" /> Resume</>}</Button>}
          {started && <Button variant="secondary" onClick={() => void finish(false)} disabled={saving}>End</Button>}
        </div>
      </Card>

      {!started && (
        <div>
          <p className="mb-2 text-xs text-zinc-600">Mode</p>
          <div className="grid grid-cols-3 gap-2">{(Object.keys(MODE_COPY) as MeditationMode[]).map((value) => <button key={value} onClick={() => setMode(value)} className={`rounded-xl border px-2 py-2.5 text-xs ${mode === value ? "border-zinc-600 bg-zinc-900 text-zinc-200" : "border-zinc-800 text-zinc-600"}`}>{MODE_COPY[value].label}</button>)}</div>
        </div>
      )}

      {started && <button onClick={() => { setStarted(false); timer.reset(minutes * 60, false); startedAt.current = null; }} className="mx-auto inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-300"><RotateCcw className="h-3 w-3" /> Restart</button>}
      {error && <p className="rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
