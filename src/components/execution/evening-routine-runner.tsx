"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Moon } from "lucide-react";
import { checkinAction } from "@/app/actions";
import { logExecutionAction } from "@/app/execution-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MobilityRunner } from "./mobility-runner";
import { MeditationRunner } from "./meditation-runner";
import { HypnosisPlayer } from "./hypnosis-player";

type Phase = "intro" | "mobility" | "meditation" | "hypnosis" | "done";

const STEPS = [
  { id: "mobility", title: "Evening mobility", detail: "8 min guided sequence" },
  { id: "meditation", title: "Meditation", detail: "5 min timer" },
  { id: "hypnosis", title: "Hypnosis", detail: "Play or resume a track" },
] as const;

export function EveningRoutineRunner({ taskId }: { taskId?: string | null }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [completed, setCompleted] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number | null>(null);

  async function completeRoutine(finalCompleted: string[]) {
    if (saving) return;
    setSaving(true);
    const completion = finalCompleted.length === 3 ? "target" : finalCompleted.length > 0 ? "floor" : "skipped";
    const startTime = startedAt.current ?? Date.now();
    const [execution, checkin] = await Promise.all([
      logExecutionAction({
        protocolId: "evening-reset",
        kind: "routine",
        durationSeconds: Math.max(60, Math.round((Date.now() - startTime) / 1000)),
        taskId: taskId ?? null,
        details: { completedSteps: finalCompleted, completion },
      }),
      checkinAction({ eveningResetCompletion: completion, eveningResetVariant: "guided_v2" }),
    ]);
    if (!execution.ok || !checkin.ok) {
      setError(execution.error ?? checkin.error ?? "Could not save evening routine.");
      setSaving(false);
      return;
    }
    setPhase("done");
    setSaving(false);
  }

  function advance(from: "mobility" | "meditation" | "hypnosis", didComplete = true) {
    const nextCompleted = didComplete && !completed.includes(from) ? [...completed, from] : completed;
    setCompleted(nextCompleted);
    if (from === "mobility") setPhase("meditation");
    else if (from === "meditation") setPhase("hypnosis");
    else void completeRoutine(nextCompleted);
  }

  if (phase === "done") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950 text-emerald-300"><Check className="h-7 w-7" /></div>
        <div><h1 className="text-2xl font-semibold text-zinc-100">Day closed</h1><p className="mt-1 text-sm text-zinc-500">{completed.length} of 3 reset steps completed. {completed.length === 3 ? "Target complete." : "Floor counted."}</p></div>
        <Link href="/"><Button>Back to Today</Button></Link>
      </div>
    );
  }

  if (phase === "mobility") return <><MobilityRunner slug="evening-mobility" onComplete={() => advance("mobility")} /><SkipBar label="Skip mobility" onSkip={() => advance("mobility", false)} /></>;
  if (phase === "meditation") return <><MeditationRunner initialMinutes={5} onComplete={() => advance("meditation")} /><SkipBar label="Skip meditation" onSkip={() => advance("meditation", false)} /></>;
  if (phase === "hypnosis") return <><HypnosisPlayer onComplete={() => advance("hypnosis")} /><SkipBar label="Finish without hypnosis" onSkip={() => advance("hypnosis", false)} /></>;

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <Link href="/execute" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200"><ArrowLeft className="h-3.5 w-3.5" /> Routines</Link>
      <header className="flex items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold text-zinc-100">Evening Reset</h1><p className="mt-1 text-sm leading-relaxed text-zinc-500">One sequence. Start it and let the app tell you what comes next.</p></div><Moon className="mt-1 h-5 w-5 text-indigo-400" /></header>

      <Card className="border-indigo-900/50 bg-indigo-950/10">
        <div className="divide-y divide-zinc-800/80">
          {STEPS.map((step, index) => <div key={step.id} className="flex items-center gap-3 py-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-xs text-zinc-500">{index + 1}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium text-zinc-200">{step.title}</p><p className="mt-0.5 text-xs text-zinc-600">{step.detail}</p></div><ChevronRight className="h-4 w-4 text-zinc-700" /></div>)}
        </div>
      </Card>

      <Button className="w-full" onClick={() => { startedAt.current = Date.now(); setPhase("mobility"); }}>Start tonight</Button>
      <p className="text-center text-xs leading-relaxed text-zinc-600">If the night is chaotic, complete what fits. A partial reset counts as the Floor instead of becoming a failed night.</p>
      {error && <p className="rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}

function SkipBar({ label, onSkip }: { label: string; onSkip: () => void }) {
  return <div className="mx-auto -mt-3 mb-4 flex max-w-md justify-center px-4"><button onClick={onSkip} className="text-xs text-zinc-600 underline-offset-4 hover:text-zinc-300 hover:underline">{label}</button></div>;
}
