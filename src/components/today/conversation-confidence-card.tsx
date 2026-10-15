"use client";

import { useEffect, useState } from "react";
import { Headphones, MessageCircle, Pause, Play, Sparkles } from "lucide-react";
import {
  advanceConfidenceRepAction,
  chooseConversationMonthAction,
  getConversationConfidenceAction,
  recordConfidenceEvidenceAction,
  renameConversationFocusAction,
  saveConversationConfidenceAction,
  setConfidenceChallengeLevelAction,
  stopConversationFocusAction,
} from "@/app/conversation-confidence-actions";
import {
  CONVERSATION_CONFIDENCE_OBJECTIVE,
  CONVERSATION_CONFIDENCE_TITLE,
  CONVERSATION_LOOP,
  formatWorkoutCountdown,
  SPEAKING_WORKOUT,
  type ConfidenceEvidenceOutcome,
} from "@/domain/conversation-confidence";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

type View = NonNullable<Awaited<ReturnType<typeof getConversationConfidenceAction>>["data"]>;

const OUTCOMES: readonly { value: ConfidenceEvidenceOutcome; label: string }[] = [
  { value: "nothing-bad", label: "Nothing bad happened" },
  { value: "awkward-handled", label: "Awkward, and I handled it" },
  { value: "disapproval-handled", label: "Someone disapproved, and I handled it" },
  { value: "noticed-avoidance", label: "I backed out, but I noticed" },
];

export function ConversationConfidenceCard() {
  const [view, setView] = useState<View | null>(null);
  const [setup, setSetup] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [workoutStep, setWorkoutStep] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [lesson, setLesson] = useState("");
  const [reviewClosed, setReviewClosed] = useState(false);
  const [resetFact, setResetFact] = useState("");
  const [resetStory, setResetStory] = useState("");
  const [resetNext, setResetNext] = useState("");
  const [resetDone, setResetDone] = useState(false);

  async function refresh() {
    const result = await getConversationConfidenceAction();
    if (result.ok) setView(result.data);
    return result;
  }

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
    const result = await saveConversationConfidenceAction({
      active: true,
      title: CONVERSATION_CONFIDENCE_TITLE,
      objective: CONVERSATION_CONFIDENCE_OBJECTIVE,
      month: 1,
      status: "active",
    });
    if (result.ok) {
      await refresh();
      setSetup(false);
    } else setError(result.error);
    setBusy(false);
  }

  async function choose(choice: "pause" | "repeat" | "next" | "skip") {
    setError(null);
    setBusy(true);
    const result = await chooseConversationMonthAction(choice);
    if (result.ok) await refresh();
    else setError(result.error);
    setBusy(false);
  }

  async function anotherRep() {
    setError(null);
    setBusy(true);
    const result = await advanceConfidenceRepAction();
    if (result.ok) {
      await refresh();
      setCheckInOpen(false);
      setLesson("");
      setReviewClosed(false);
    } else setError(result.error);
    setBusy(false);
  }

  async function makeTiny() {
    setError(null);
    setBusy(true);
    const result = await setConfidenceChallengeLevelAction("tiny");
    if (result.ok) {
      await refresh();
      setCheckInOpen(false);
    } else setError(result.error);
    setBusy(false);
  }

  async function record(outcome: ConfidenceEvidenceOutcome) {
    setError(null);
    setBusy(true);
    const result = await recordConfidenceEvidenceAction({ outcome, lesson });
    if (result.ok) {
      await refresh();
      setCheckInOpen(false);
      setLesson("");
      setReviewClosed(true);
    } else setError(result.error);
    setBusy(false);
  }

  async function rename() {
    setBusy(true);
    setError(null);
    const result = await renameConversationFocusAction(newTitle);
    if (result.ok) {
      await refresh();
      setNewTitle("");
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
          <CardHeader
            title="Optional annual focus"
            subtitle="Build self-trust through small real-world confidence reps."
            right={<MessageCircle className="h-4 w-4 text-violet-400" />}
          />
          {!setup ? (
            <Button size="sm" variant="secondary" onClick={() => setSetup(true)}>
              Choose Self-Trust & Confidence
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void activate()} disabled={busy}>
                {busy ? "Saving…" : "Choose this focus"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>Not today</Button>
            </div>
          )}
          {error && <p className="mt-2 text-xs text-amber-300" role="alert">{error}</p>}
        </Card>
      </div>
    );
  }

  const current = view.month;
  const phase = view.monday.phase;
  const rep = view.rep;
  const summary = view.summary;

  return (
    <div className="px-4 pb-4">
      <Card className="border-violet-950/70 bg-violet-950/10">
        <CardHeader
          title="Confidence practice"
          subtitle={phase.title + " · Month " + current.number + " of 12"}
          right={<Sparkles className="h-4 w-4 text-violet-400" />}
        />

        {view.path.status === "paused" ? (
          <>
            <p className="text-sm font-medium text-zinc-200">This path is paused.</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">No practice debt or missed-month penalty. Resume when it is useful.</p>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-violet-900/50 bg-zinc-950/25 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-violet-300">This week&apos;s edge</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-200">{phase.edge}</p>
            </div>

            <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/25 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Today&apos;s rep</p>
                {rep.challengeLevel === "tiny" && <span className="text-[11px] text-emerald-300">Tiny version</span>}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-zinc-200">{rep.label}</p>
              <p className="mt-2 text-[11px] text-zinc-500">The rep counts because you acted with discomfort present, not because you felt confident.</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setCheckInOpen((value) => !value)} disabled={busy}>I did it</Button>
                <Button size="sm" variant="secondary" onClick={() => void anotherRep()} disabled={busy}>Give me another</Button>
                {rep.challengeLevel === "normal" ? (
                  <Button size="sm" variant="ghost" onClick={() => void makeTiny()} disabled={busy}>This is too much today</Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>Not today</Button>
                )}
              </div>
            </div>

            {checkInOpen && (
              <div className="mt-3 rounded-xl border border-emerald-900/50 bg-emerald-950/10 p-3">
                <p className="text-xs font-medium text-zinc-200">What actually happened?</p>
                <p className="mt-1 text-[11px] text-zinc-500">Choose one. Add at most one useful lesson, then close the review.</p>
                <input
                  className="mt-3 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-base text-zinc-100 sm:text-sm"
                  value={lesson}
                  onChange={(event) => setLesson(event.target.value)}
                  maxLength={240}
                  placeholder="One useful lesson (optional)"
                  aria-label="One useful lesson"
                />
                <div className="mt-3 grid gap-2">
                  {OUTCOMES.map((outcome) => (
                    <Button
                      key={outcome.value}
                      size="sm"
                      variant="secondary"
                      onClick={() => void record(outcome.value)}
                      disabled={busy}
                    >
                      {outcome.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {reviewClosed && (
              <p className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/20 px-3 py-2 text-xs text-zinc-400">
                Review closed. You got the useful information; more tape review probably will not help.
              </p>
            )}

            <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/20 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Confidence evidence</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                {summary.total} real-world reps · {summary.fearedOutcomeDidNotHappen} feared outcomes did not happen · {summary.disapprovalAndHandled} times you handled disapproval
              </p>
              <p className="mt-1 text-[11px] text-zinc-600">No confidence score. This is evidence that you can act and recover.</p>
            </div>

            <details className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/20 p-3">
              <summary className="cursor-pointer text-xs font-medium text-zinc-300">Opinion Reset</summary>
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">Use this when someone&apos;s expression, tone, or possible judgment starts running the show. These notes stay local and are not saved.</p>
              <label className="mt-3 block text-[11px] text-zinc-500">
                1. What literally happened?
                <input
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-base text-zinc-100 sm:text-sm"
                  value={resetFact}
                  onChange={(event) => { setResetFact(event.target.value); setResetDone(false); }}
                  placeholder="The observable facts"
                />
              </label>
              <label className="mt-3 block text-[11px] text-zinc-500">
                2. What story am I adding?
                <input
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-base text-zinc-100 sm:text-sm"
                  value={resetStory}
                  onChange={(event) => { setResetStory(event.target.value); setResetDone(false); }}
                  placeholder="They think I am…"
                />
              </label>
              <p className="mt-3 text-xs text-zinc-400">3. Does this person&apos;s opinion deserve this much influence?</p>
              <label className="mt-3 block text-[11px] text-zinc-500">
                4. What would I do next if I did not need to fix their opinion?
                <input
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-base text-zinc-100 sm:text-sm"
                  value={resetNext}
                  onChange={(event) => { setResetNext(event.target.value); setResetDone(false); }}
                  placeholder="The next action"
                />
              </label>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" onClick={() => setResetDone(true)} disabled={!resetNext.trim()}>Do that</Button>
                {resetDone && <span className="text-xs text-zinc-400">Go do it before analyzing this further.</span>}
              </div>
            </details>

            <details className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/20 p-3">
              <summary className="cursor-pointer text-xs text-zinc-400">Social confidence tools</summary>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={toggleWorkout}>
                  <Play className="mr-1 h-3.5 w-3.5" />5-minute speaking practice
                </Button>
              </div>
              {workoutStep !== null && (
                <div className="mt-3 rounded-xl border border-violet-900/50 bg-zinc-950/30 p-3">
                  <p className="text-xs text-violet-200">{SPEAKING_WORKOUT[workoutStep]} · {formatWorkoutCountdown(elapsedSeconds)}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">Pauses are allowed. No microphone or recording.</p>
                </div>
              )}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {CONVERSATION_LOOP.map((item) => (
                  <p key={item.label} className="text-[11px] text-zinc-500">
                    <span className="font-medium text-zinc-300">{item.label}:</span> {item.prompt}
                  </p>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-zinc-600">A pause does not mean the conversation failed.</p>
              {view.resources[0] && (
                <a
                  className="mt-3 flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200"
                  href={view.resources[0].url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Headphones className="h-3.5 w-3.5" />
                  Optional support: {view.resources[0].title} · {view.resources[0].access.replace("-", " ")}
                </a>
              )}
            </details>
          </>
        )}

        <details className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/20 p-3">
          <summary className="cursor-pointer text-xs text-zinc-400">About this year</summary>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">{view.path.objective}</p>
          <p className="mt-2 text-xs text-zinc-500">Current month: {current.theme}. Months are relative; the calendar never advances you automatically.</p>
          <p className="mt-2 text-xs text-zinc-500">{view.monday.practice}</p>
        </details>

        <details className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/20 p-3">
          <summary className="cursor-pointer text-xs text-zinc-400">Manage this focus</summary>
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-base text-zinc-200 sm:text-sm"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder={view.path.title}
                aria-label="New focus title"
              />
              <Button size="sm" variant="secondary" onClick={() => void rename()} disabled={busy || !newTitle.trim()}>Rename</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => void choose("repeat")} disabled={busy}>
                {view.path.status === "paused" ? "Resume this month" : "Repeat month"}
              </Button>
              {view.path.status !== "paused" && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => void choose("next")} disabled={busy}>Next month</Button>
                  <Button size="sm" variant="ghost" onClick={() => void choose("skip")} disabled={busy}>Skip month</Button>
                  <Button size="sm" variant="ghost" onClick={() => void choose("pause")} disabled={busy}>
                    <Pause className="mr-1 h-3.5 w-3.5" />Pause
                  </Button>
                </>
              )}
              <Button size="sm" variant="ghost" onClick={() => void stop()} disabled={busy}>Stop focus</Button>
            </div>
          </div>
        </details>

        {error && <p className="mt-2 text-xs text-amber-300" role="alert">{error}</p>}
      </Card>
    </div>
  );
}
