"use client";

import { useEffect, useState } from "react";
import { Headphones, MessageCircle, Pause, Play, Sparkles, Square } from "lucide-react";
import { chooseConversationMonthAction, getConversationConfidenceAction, saveConversationConfidenceAction } from "@/app/conversation-confidence-actions";
import { CONVERSATION_CONFIDENCE_OBJECTIVE, CONVERSATION_CONFIDENCE_TITLE, CONVERSATION_LOOP, SPEAKING_WORKOUT } from "@/domain/conversation-confidence";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

type View = NonNullable<Awaited<ReturnType<typeof getConversationConfidenceAction>>["data"]>;

export function ConversationConfidenceCard() {
  const [view, setView] = useState<View | null>(null);
  const [setup, setSetup] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [workoutStep, setWorkoutStep] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  useEffect(() => {
    let active = true;
    void getConversationConfidenceAction().then((result) => {
      if (active && result.ok) setView(result.data);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (workoutStep === null) return;
    const timer = window.setInterval(() => setSeconds((value) => {
      if (value >= 59) {
        setWorkoutStep((step) => step === null || step >= SPEAKING_WORKOUT.length - 1 ? null : step + 1);
        return 0;
      }
      return value + 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [workoutStep]);

  if (dismissed || !view || view.path.status === "stopped") return null;

  async function activate() {
    setBusy(true);
    const result = await saveConversationConfidenceAction({ active: true, title: CONVERSATION_CONFIDENCE_TITLE, objective: CONVERSATION_CONFIDENCE_OBJECTIVE, month: 1, status: "active" });
    if (result.ok) {
      const refreshed = await getConversationConfidenceAction();
      if (refreshed.ok) { setView(refreshed.data); setSetup(false); }
    }
    setBusy(false);
  }

  async function choose(choice: "pause" | "repeat" | "next" | "skip") {
    setBusy(true);
    const result = await chooseConversationMonthAction(choice);
    if (result.ok) {
      const refreshed = await getConversationConfidenceAction();
      if (refreshed.ok) setView(refreshed.data);
    }
    setBusy(false);
  }

  async function renameFocus() {
    const title = titleDraft.trim();
    if (!title) return;
    setBusy(true);
    const result = await saveConversationConfidenceAction({ ...view!.path, title });
    if (result.ok) {
      const refreshed = await getConversationConfidenceAction();
      if (refreshed.ok) setView(refreshed.data);
      setEditingTitle(false);
    }
    setBusy(false);
  }

  async function stopFocus() {
    setBusy(true);
    const result = await saveConversationConfidenceAction({ ...view!.path, active: false, status: "stopped" });
    if (result.ok) {
      const refreshed = await getConversationConfidenceAction();
      if (refreshed.ok) setView(refreshed.data);
    }
    setBusy(false);
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
  const totalSecondsRemaining = workoutStep === null
    ? 0
    : Math.max(0, (SPEAKING_WORKOUT.length - workoutStep) * 60 - seconds);
  const timerLabel = `${String(Math.floor(totalSecondsRemaining / 60)).padStart(2, "0")}:${String(totalSecondsRemaining % 60).padStart(2, "0")}`;
  return (
    <div className="px-4 pb-4">
      <Card className="border-violet-950/70 bg-violet-950/10">
        <CardHeader title="Today’s thread" subtitle={`${view.path.title} · Month ${current.number}`} right={<Sparkles className="h-4 w-4 text-violet-400" />} />
        {view.path.status === "paused" ? <><p className="text-sm font-medium text-zinc-200">This path is paused.</p><p className="mt-1 text-xs leading-relaxed text-zinc-400">No practice debt or missed-month penalty. Resume when it is useful.</p></> : <><p className="text-sm font-medium text-zinc-200">{current.theme}</p><p className="mt-1 text-xs leading-relaxed text-zinc-400">{view.monday.skill}</p></>}
        <div className="mt-3 flex flex-wrap gap-2">
          {view.path.status !== "paused" && <Button size="sm" variant="secondary" onClick={() => setWorkoutStep(workoutStep === null ? 0 : null)}><Play className="mr-1 h-3.5 w-3.5" />5-minute practice</Button>}
          <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>Not today</Button>
        </div>
        {workoutStep !== null && <div className="mt-3 rounded-xl border border-violet-900/50 bg-zinc-950/30 p-3"><p className="text-xs text-violet-200">{SPEAKING_WORKOUT[workoutStep]} · {timerLabel}</p><p className="mt-1 text-[11px] text-zinc-500">Pauses are allowed. No microphone or recording.</p></div>}
        {view.resources[0] && <a className="mt-3 flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200" href={view.resources[0].url} target="_blank" rel="noreferrer"><Headphones className="h-3.5 w-3.5" />Optional support: {view.resources[0].title} · {view.resources[0].access.replace("-", " ")}</a>}
        <details className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/20 p-3"><summary className="cursor-pointer text-xs text-zinc-400">In the moment</summary><div className="mt-2 grid gap-2 sm:grid-cols-2">{CONVERSATION_LOOP.map((item) => <p key={item.label} className="text-[11px] text-zinc-500"><span className="font-medium text-zinc-300">{item.label}:</span> {item.prompt}</p>)}</div><p className="mt-2 text-[11px] text-zinc-600">A pause does not mean the conversation failed.</p></details>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => void choose("repeat")} disabled={busy}>{view.path.status === "paused" ? "Resume this month" : "Repeat month"}</Button>
          {view.path.status !== "paused" && <>
            <Button size="sm" variant="ghost" onClick={() => void choose("next")} disabled={busy}>Next month</Button>
            <Button size="sm" variant="ghost" onClick={() => void choose("skip")} disabled={busy}>Skip month</Button>
            <Button size="sm" variant="ghost" onClick={() => void choose("pause")} disabled={busy}><Pause className="mr-1 h-3.5 w-3.5" />Pause</Button>
          </>}
        </div>
        <details className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/20 p-3">
          <summary className="cursor-pointer text-xs text-zinc-500">Focus controls</summary>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {!editingTitle ? (
              <Button size="sm" variant="ghost" onClick={() => { setTitleDraft(view.path.title); setEditingTitle(true); }}>Rename</Button>
            ) : (
              <>
                <input aria-label="Focus title" className="min-w-0 flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200" value={titleDraft} maxLength={120} onChange={(event) => setTitleDraft(event.target.value)} />
                <Button size="sm" variant="secondary" onClick={() => void renameFocus()} disabled={busy || !titleDraft.trim()}>Save name</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>Cancel</Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={() => void stopFocus()} disabled={busy}><Square className="mr-1 h-3.5 w-3.5" />Stop focus</Button>
          </div>
        </details>
      </Card>
    </div>
  );
}
