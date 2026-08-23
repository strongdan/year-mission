"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Dumbbell, ExternalLink, RotateCcw, Timer } from "lucide-react";
import { getExecutionSettingsAction, logExecutionAction, type ExecutionSettings } from "@/app/execution-actions";
import {
  DEFAULT_EQUIPMENT,
  WORKOUT_PROTOCOLS,
  chooseExercise,
  equipmentFits,
  type EquipmentId,
} from "@/domain/execution-protocols";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatClock, useCountdown } from "./use-countdown";

interface SetEntry {
  reps: string;
  weight: string;
}

export function WorkoutRunner({ slug, taskId }: { slug: string; taskId?: string | null }) {
  const protocol = WORKOUT_PROTOCOLS[slug];
  const [settings, setSettings] = useState<ExecutionSettings>({
    equipment: DEFAULT_EQUIPMENT,
    pumpClubUrl: "",
    audiobookshelfUrl: "",
    hypnosisMedia: [],
  });
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [entries, setEntries] = useState<Record<string, SetEntry[]>>({});
  const [selectedTitles, setSelectedTitles] = useState<Record<string, { title: string; reps: string }>>({});
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number | null>(null);
  const rest = useCountdown(0, () => {
    if ("vibrate" in navigator) navigator.vibrate?.(120);
  });

  useEffect(() => {
    getExecutionSettingsAction().then((result) => {
      if (result.ok && result.data) setSettings(result.data.settings);
    });
  }, []);

  const exercise = protocol?.exercises[exerciseIndex];
  const available = settings.equipment as EquipmentId[];
  const automatic = useMemo(() => {
    if (!exercise) return null;
    return chooseExercise(exercise, available);
  }, [available, exercise]);
  const selected = exercise
    ? selectedTitles[exercise.id] ?? (automatic ? { title: automatic.title, reps: automatic.reps } : { title: exercise.title, reps: exercise.reps })
    : null;

  if (!protocol) {
    return <div className="p-4 text-sm text-zinc-400">Workout protocol not found.</div>;
  }

  if (finished) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950 text-emerald-300"><Check className="h-7 w-7" /></div>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Workout complete</h1>
          <p className="mt-1 text-sm text-zinc-500">Logged automatically. The linked task is complete too.</p>
        </div>
        <Link href="/"><Button>Back to Today</Button></Link>
      </div>
    );
  }

  if (!exercise || !selected) return null;

  const compatibleAlternatives = exercise.alternatives.filter((alternative) => equipmentFits(alternative.equipment, available));
  const baseCompatible = equipmentFits(exercise.equipment, available);
  const completedSets = entries[exercise.id]?.length ?? 0;
  const progressDone = protocol.exercises.slice(0, exerciseIndex).reduce((sum, item) => sum + item.sets, 0) + completedSets;
  const totalSets = protocol.exercises.reduce((sum, item) => sum + item.sets, 0);
  const progressPercent = Math.round((progressDone / totalSets) * 100);

  function markStarted() {
    if (startedAt.current === null) startedAt.current = Date.now();
  }

  async function finishWorkout(nextEntries: Record<string, SetEntry[]>) {
    setSaving(true);
    setError(null);
    const startTime = startedAt.current ?? Date.now();
    const durationSeconds = Math.max(60, Math.round((Date.now() - startTime) / 1000));
    const result = await logExecutionAction({
      protocolId: protocol.slug,
      kind: "strength",
      durationSeconds,
      taskId: taskId ?? null,
      details: {
        exercises: protocol.exercises.map((item) => ({
          id: item.id,
          title: selectedTitles[item.id]?.title ?? chooseExercise(item, available).title,
          sets: nextEntries[item.id] ?? [],
        })),
      },
    });
    if (!result.ok) {
      setError(result.error ?? "Could not save workout.");
      setSaving(false);
      return;
    }
    setFinished(true);
    setSaving(false);
  }

  async function completeSet() {
    if (saving || !exercise || !selected) return;
    markStarted();
    const entry: SetEntry = { reps: reps.trim() || selected.reps, weight: weight.trim() };
    const nextEntries = {
      ...entries,
      [exercise.id]: [...(entries[exercise.id] ?? []), entry],
    };
    setEntries(nextEntries);
    setReps("");

    const lastSet = setIndex >= exercise.sets - 1;
    const lastExercise = exerciseIndex >= protocol.exercises.length - 1;
    if (lastSet && lastExercise) {
      await finishWorkout(nextEntries);
      return;
    }

    rest.reset(exercise.restSeconds, true);
    if (lastSet) {
      setExerciseIndex((value) => value + 1);
      setSetIndex(0);
    } else {
      setSetIndex((value) => value + 1);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <Link href="/execute" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200"><ArrowLeft className="h-3.5 w-3.5" /> Routines</Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-100">{protocol.title}</h1>
          <p className="mt-1 text-xs text-zinc-500">{exerciseIndex + 1} of {protocol.exercises.length} exercises · set {setIndex + 1} of {exercise.sets}</p>
        </div>
        <Dumbbell className="mt-6 h-5 w-5 text-sky-400" />
      </header>

      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-900"><div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${progressPercent}%` }} /></div>

      {rest.secondsLeft > 0 && (
        <Card className="border-amber-900/50 bg-amber-950/15">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><Timer className="h-4 w-4 text-amber-400" /><div><p className="text-xs text-zinc-500">Rest</p><p className="text-2xl font-semibold tabular-nums text-amber-200">{formatClock(rest.secondsLeft)}</p></div></div>
            <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={rest.toggle}>{rest.running ? "Pause" : "Resume"}</Button><Button size="sm" variant="secondary" onClick={() => rest.reset(0, false)}>Skip</Button></div>
          </div>
        </Card>
      )}

      <Card className="border-sky-900/60 bg-sky-950/15">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-sky-400/80">Do this set</p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-zinc-50">{selected.title}</h2>
        <p className="mt-1 text-sm text-zinc-400">Target: {selected.reps}</p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">{exercise.cue}</p>
        {!baseCompatible && selected.title !== exercise.title && <p className="mt-2 text-xs text-emerald-400">Substituted automatically for your available equipment.</p>}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="text-xs text-zinc-500">Reps<input value={reps} onFocus={markStarted} onChange={(event) => setReps(event.target.value)} inputMode="numeric" placeholder={selected.reps} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-base text-zinc-100 outline-none focus:border-sky-700" /></label>
          <label className="text-xs text-zinc-500">Weight <span className="text-zinc-700">optional</span><input value={weight} onFocus={markStarted} onChange={(event) => setWeight(event.target.value)} inputMode="decimal" placeholder="lb" className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-base text-zinc-100 outline-none focus:border-sky-700" /></label>
        </div>
        <Button className="mt-4 w-full" onClick={completeSet} disabled={saving}>{saving ? "Saving…" : setIndex === exercise.sets - 1 && exerciseIndex === protocol.exercises.length - 1 ? "Complete workout" : "Complete set"}</Button>
      </Card>

      <details className="rounded-xl border border-zinc-800 bg-zinc-900/25 px-3 py-2.5">
        <summary className="cursor-pointer text-sm text-zinc-400">Exercise alternatives</summary>
        <div className="mt-3 flex flex-col gap-2">
          {baseCompatible && <button className="flex items-center justify-between rounded-lg px-2 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800" onClick={() => setSelectedTitles((current) => ({ ...current, [exercise.id]: { title: exercise.title, reps: exercise.reps } }))}><span>{exercise.title}</span>{selected.title === exercise.title && <Check className="h-4 w-4 text-emerald-400" />}</button>}
          {compatibleAlternatives.map((alternative) => <button key={alternative.title} className="flex items-center justify-between rounded-lg px-2 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800" onClick={() => setSelectedTitles((current) => ({ ...current, [exercise.id]: { title: alternative.title, reps: alternative.reps ?? exercise.reps } }))}><span>{alternative.title} · {alternative.reps ?? exercise.reps}</span>{selected.title === alternative.title && <Check className="h-4 w-4 text-emerald-400" />}</button>)}
          {!baseCompatible && compatibleAlternatives.length === 0 && <p className="text-xs text-amber-300">No compatible alternative is configured. Update equipment in Settings or use your lifting app.</p>}
        </div>
      </details>

      {settings.pumpClubUrl && (
        <a href={settings.pumpClubUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-zinc-800 px-3 py-3 text-sm text-zinc-400 hover:border-zinc-700 hover:text-zinc-100"><span>Prefer your lifting app?</span><span className="inline-flex items-center gap-1.5 text-zinc-300">Open Pump Club <ExternalLink className="h-3.5 w-3.5" /></span></a>
      )}

      <div className="flex items-center justify-between text-xs text-zinc-600"><span>{protocol.estimatedMinutes} min planned</span><button onClick={() => { setExerciseIndex(0); setSetIndex(0); setEntries({}); setReps(""); setWeight(""); rest.reset(0, false); startedAt.current = null; }} className="inline-flex items-center gap-1 hover:text-zinc-300"><RotateCcw className="h-3 w-3" /> Restart</button></div>
      {error && <p className="rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
