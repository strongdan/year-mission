"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Pause, Play } from "lucide-react";
import { completeTaskAction, getTasksAction, startTaskAction } from "@/app/actions";
import { logFocusSessionAction } from "@/app/execution-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatClock, useCountdown } from "./use-countdown";

export function FocusRunner({ taskId, initialMinutes = 5 }: { taskId: string; initialMinutes?: number }) {
  const minutes = Math.max(1, Math.min(60, initialMinutes));
  const [title, setTitle] = useState("This task");
  const [started, setStarted] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number | null>(null);
  const timer = useCountdown(minutes * 60, () => {
    setTimerFinished(true);
    if ("vibrate" in navigator) navigator.vibrate?.([80, 60, 80]);
  });

  useEffect(() => {
    getTasksAction().then((result) => {
      if (!result.ok || !result.data) return;
      const task = [...result.data.today, ...result.data.week, ...result.data.inbox, ...result.data.backlog].find((item) => item.id === taskId);
      if (task) setTitle(task.title);
    });
  }, [taskId]);

  async function begin() {
    const result = await startTaskAction(taskId);
    if (!result.ok) {
      setError(result.error ?? "Could not start task.");
      return;
    }
    startedAt.current = Date.now();
    setStarted(true);
    timer.reset(minutes * 60, true);
  }

  async function stop(completedTask: boolean) {
    if (saving) return;
    setSaving(true);
    setError(null);
    const startTime = startedAt.current ?? Date.now();
    const elapsed = Math.max(30, Math.round((Date.now() - startTime) / 1000));
    if (completedTask) {
      const complete = await completeTaskAction(taskId);
      if (!complete.ok) {
        setError(complete.error ?? "Could not complete task.");
        setSaving(false);
        return;
      }
      await logFocusSessionAction({ taskId, durationSeconds: Math.min(minutes * 60, elapsed), completedTask: false });
    } else {
      const result = await logFocusSessionAction({ taskId, durationSeconds: Math.min(minutes * 60, elapsed), completedTask: false });
      if (!result.ok) {
        setError(result.error ?? "Could not save starter session.");
        setSaving(false);
        return;
      }
    }
    setDone(true);
    setSaving(false);
  }

  if (done) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950 text-emerald-300"><Check className="h-7 w-7" /></div>
        <div><h1 className="text-2xl font-semibold text-zinc-100">You made contact</h1><p className="mt-1 max-w-xs text-sm leading-relaxed text-zinc-500">Starting while you did not feel like starting is the rep. Continue later if needed.</p></div>
        <Link href="/"><Button>Back to Today</Button></Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <Link href="/" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200"><ArrowLeft className="h-3.5 w-3.5" /> Today</Link>
      <header><p className="text-[11px] font-medium uppercase tracking-[0.14em] text-orange-400/80">Anti-avoidance start</p><h1 className="mt-2 text-2xl font-semibold leading-tight text-zinc-100">{title}</h1><p className="mt-1 text-sm text-zinc-500">You are not agreeing to finish. Just stay with it for {minutes} minutes.</p></header>

      <Card className="flex min-h-[330px] flex-col items-center justify-center border-orange-900/50 bg-orange-950/10 text-center">
        <p className="text-7xl font-semibold tabular-nums tracking-tight text-zinc-100">{formatClock(started ? timer.secondsLeft : minutes * 60)}</p>
        <p className="mt-5 max-w-xs text-sm leading-relaxed text-zinc-500">Open the thing. Do the next concrete action. Do not evaluate whether you want to finish yet.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {!started ? <Button onClick={begin}><Play className="mr-1.5 h-4 w-4" /> Start {minutes} minutes</Button> : <Button onClick={timer.toggle}>{timer.running ? <><Pause className="mr-1.5 h-4 w-4" /> Pause</> : <><Play className="mr-1.5 h-4 w-4" /> Resume</>}</Button>}
        </div>
      </Card>

      {started && (
        <div className="flex flex-col gap-2">
          {timerFinished && <p className="text-center text-sm font-medium text-emerald-300">Time. You kept the starting commitment.</p>}
          <Button onClick={() => void stop(true)} disabled={saving}>Task is done</Button>
          <Button variant="secondary" onClick={() => { timer.reset(minutes * 60, true); setTimerFinished(false); }}>Continue {minutes} more minutes</Button>
          <Button variant="ghost" onClick={() => void stop(false)} disabled={saving}>Stop here — keep the task open</Button>
        </div>
      )}
      {error && <p className="rounded-xl border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
