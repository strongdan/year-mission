"use client";

import { useEffect, useState } from "react";
import { Headphones, MessageCircle, Pause, Play, Sparkles } from "lucide-react";
import { chooseConversationMonthAction, getConversationConfidenceAction, renameConversationFocusAction, saveConversationConfidenceAction, stopConversationFocusAction } from "@/app/conversation-confidence-actions";
import { CONVERSATION_CONFIDENCE_OBJECTIVE, CONVERSATION_CONFIDENCE_TITLE, CONVERSATION_LOOP, formatWorkoutCountdown, SPEAKING_WORKOUT } from "@/domain/conversation-confidence";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

type View = NonNullable<Awaited<ReturnType<typeof getConversationConfidenceAction>>["data"]>;

export function ConversationConfidenceCard() {
  const [view, setView] = useState<View | null>(null);
  const [setup, setSetup] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [workoutStep, setWorkoutStep] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    let active = true;
    void getConversationConfidenceAction().then((result) => {
      if (active && result.ok) setView(result.data);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (workoutStep === null) return;
    const timer = window.setInterval(() => setElapsedSeconds((value) => {
      const next = value + 1;
      if (next >= 300) {
        setWorkoutStep(null);
        return 300;
      }
      setWorkoutStep(Math.floor(next / 60));
      return next;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [workoutStep]);

  if (dismissed || !view) return null;

  async function activate() {
    setError(null);
    setBusy(true);
    const result = await saveConversationConfidenceAction({ active: true, title: CONVERSATION_CONFIDENCE_TITLE, objective: CONVERSATION_CONFIDENCE_OBJECTIVE, month: 1, status: "active" });
    if (result.ok) {
      const refreshed = await getConversationConfidenceAction();
      if (refreshed.ok) { setView(refreshed.data); setSetup(false); }
    } else setError(result.error);
    setBusy(false);
  }

  async function choose(choice: "pause" | "repeat" | "next" | "skip") {
    setError(null);
    setBusy(true);
    const result = await chooseConversationMonthAction(choice);
    if (result.ok) {
      const refreshed = await getConversationConfidenceAction();
      if (refreshed.ok) setView(refreshed.data);
    } else setError(result.error);
    setBusy(false);
  }

  async function rename() {
    setBusy(true);
    setError(null);
    const result = await renameConversationFocusAction(newTitle);
    if (result.ok) {
      const refreshed = await getConversationConfidenceAction();
      if (refreshed.ok) { setView(refreshed.data); setNewTitle(""); }
    } else setError(result.error);
    setBusy(false);
  }

  async function stop() {
    setBusy(true);
    setError(null);
    const result = await stopConversationFocusAction();
    if (result.ok) setView(null);
    else setError(result.error);
    setBusy(false);
  }

  function toggleWorkout() {
    if (workoutStep === null) {
      setElapsedSeconds(0);
      setWorkoutStep(0);
    } else {
      setWorkoutStep(null);
    }
  }

  if (!view.path.active) {
    return (
      <div className="px-4 pb-4">
        <Card>
          <CardHeader title="Optional annual focus" subtitle="A low-pressure path for social ease and expression." right={<MessageCircle className="h-4 w-4 text-violet-400" />} />
          {!setup ? <Button size="sm" variant="secondary" onClick={() => setSetup(true)}>Choose Social Ease & Expression</Button> : <div className="flex gap-2"><Button size="sm" onClick={() => void activate()} disabled={busy}>{busy ? "Saving…" : "Choose this focus"}</Button><Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>Not today</Button></div>}
        </Card>
      </div>
    );
  }

  const current = view.month;
  return (
    <div className="px-4 pb-4">
      <Card className="border-violet-950/70 bg-violet-950/10">
        <CardHeader title="Today’s thread" subtitle={`${view.path.title} · Month ${current.number}`} right={<Sparkles className="h-4 w-4 text-violet-400" />} />
        {view.path.status === "paused" ? <><p className="text-sm font-medium text-zinc-200">This path is paused.</p><p className="mt-1 text-xs leading-relaxed text-zinc-400">No practice debt or missed-month penalty. Resume when it is useful.</p></> : <><p className="text-sm font-medium text-zinc-200">{current.theme}</p><p className="mt-1 text-xs leading-relaxed text-zinc-400">{view.monday.skill}</p></>}
        <div className="mt-3 flex flex-wrap gap-2">
          {view.path.status !== "paused" && <Button size="sm" variant="secondary" onClick={toggleWorkout}><Play className="mr-1 h-3.5 w-3.5" />5-minute practice</Button>}
          <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>Not today</Button>
        </div>
        {workoutStep !== null && <div className="mt-3 rounded-xl border border-violet-900/50 bg-zinc-950/30 p-3"><p className="text-xs text-violet-200">{SPEAKING_WORKOUT[workoutStep]} · {formatWorkoutCountdown(elapsedSeconds)}</p><p className="mt-1 text-[11px] text-zinc-500">Pauses are allowed. No microphone or recording.</p></div>}
        {view.resources[0] && <a className="mt-3 flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200" href={view.resources[0].url} target="_blank" rel="noreferrer"><Headphones className="h-3.5 w-3.5" />Optional support: {view.resources[0].title} · {view.resources[0].access.replace("-", " ")}</a>}
        <details className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/20 p-3"><summary className="cursor-pointer text-xs text-zinc-400">In the moment</summary><div className="mt-2 grid gap-2 sm:grid-cols-2">{CONVERSATION_LOOP.map((item) => <p key={item.label} className="text-[11px] text-zinc-500"><span className="font-medium text-zinc-300">{item.label}:</span> {item.prompt}</p>)}</div><p className="mt-2 text-[11px] text-zinc-600">A pause does not mean the conversation failed.</p></details>
        <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/20 p-3"><p className="text-[11px] text-zinc-500">This week’s opportunity</p><p className="mt-1 text-xs text-zinc-300">{view.monday.practice}</p></div>
        <details className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/20 p-3"><summary className="cursor-pointer text-xs text-zinc-400">Manage this focus</summary><div className="mt-3 flex flex-col gap-2"><div className="flex gap-2"><input className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder={view.path.title} aria-label="New focus title" /><Button size="sm" variant="secondary" onClick={() => void rename()} disabled={busy || !newTitle.trim()}>Rename</Button></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => void choose("repeat")} disabled={busy}>{view.path.status === "paused" ? "Resume this month" : "Repeat month"}</Button>{view.path.status !== "paused" && <><Button size="sm" variant="ghost" onClick={() => void choose("next")} disabled={busy}>Next month</Button><Button size="sm" variant="ghost" onClick={() => void choose("skip")} disabled={busy}>Skip month</Button><Button size="sm" variant="ghost" onClick={() => void choose("pause")} disabled={busy}><Pause className="mr-1 h-3.5 w-3.5" />Pause</Button></> }<Button size="sm" variant="ghost" onClick={() => void stop()} disabled={busy}>Stop focus</Button></div></div></details>
        {error && <p className="mt-2 text-xs text-amber-300" role="alert">{error}</p>}
      </Card>
    </div>
  );
}
