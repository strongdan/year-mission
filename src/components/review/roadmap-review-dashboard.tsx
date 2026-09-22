"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { dropTaskAction, promoteToWeekAction } from "@/app/actions";
import { createDecisionAction, getRoadmapReviewAction, recordDecisionOutcomeAction } from "@/app/review-actions";
import { scorecardDomainLabel } from "@/domain/monthly-scorecard";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ReviewData = NonNullable<Awaited<ReturnType<typeof getRoadmapReviewAction>>["data"]>;

function daysOld(updatedAt: string): number {
  const delta = Date.now() - new Date(updatedAt).getTime();
  return Math.max(0, Math.floor(delta / 86_400_000));
}

export function RoadmapReviewDashboard() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState("");
  const [context, setContext] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [confidence, setConfidence] = useState("70");
  const [reviewDate, setReviewDate] = useState("");
  const [outcomes, setOutcomes] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      const result = await getRoadmapReviewAction();
      if (!result.ok || !result.data) return setError(result.error ?? "Review data could not be loaded.");
      setData(result.data);
      setError(null);
    });
  };

  useEffect(() => { load(); }, []);

  const monthLabel = useMemo(() => {
    if (!data) return "This month";
    return new Date(`${data.monthStart}T12:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [data]);

  function addDecision() {
    if (!decision.trim()) return;
    startTransition(async () => {
      const parsedConfidence = Number(confidence);
      const result = await createDecisionAction({
        decision,
        context,
        reasoning,
        confidence: Number.isFinite(parsedConfidence) ? parsedConfidence : null,
        reviewDate: reviewDate || null,
      });
      if (!result.ok) return setError(result.error ?? "Decision could not be saved.");
      setDecision(""); setContext(""); setReasoning(""); setConfidence("70"); setReviewDate("");
      load();
    });
  }

  if (!data && !error) return <div className="p-4 text-sm text-zinc-500">Loading review…</div>;

  return (
    <div className="flex flex-col gap-4 p-4 pb-10">
      <header>
        <h1 className="text-xl font-semibold text-zinc-100">Review</h1>
        <p className="mt-1 text-xs text-zinc-500">Clear stale commitments, notice the month, and learn from decisions.</p>
      </header>

      {error && <div className="rounded-xl border border-red-900/50 bg-red-950/20 px-3 py-2 text-xs text-red-300">{error}</div>}

      {data && (
        <>
          <Card>
            <CardHeader title={`${monthLabel} scorecard`} subtitle="A compact signal, not a grade." />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl bg-zinc-900/70 p-3"><p className="text-[11px] text-zinc-500">Meaningful tasks</p><p className="mt-1 text-2xl font-semibold text-zinc-100">{data.scorecard.meaningfulTasks}</p></div>
              <div className="rounded-xl bg-zinc-900/70 p-3"><p className="text-[11px] text-zinc-500">Weekly wins</p><p className="mt-1 text-2xl font-semibold text-zinc-100">{data.scorecard.weeklyWins}</p></div>
              <div className="rounded-xl bg-zinc-900/70 p-3"><p className="text-[11px] text-zinc-500">Courage tasks</p><p className="mt-1 text-2xl font-semibold text-zinc-100">{data.scorecard.courageTasks}</p></div>
              <div className="rounded-xl bg-zinc-900/70 p-3"><p className="text-[11px] text-zinc-500">Workouts</p><p className="mt-1 text-2xl font-semibold text-zinc-100">{data.scorecard.workouts}</p></div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 p-3"><p className="text-[11px] uppercase tracking-wide text-zinc-600">Strongest signal</p><p className="mt-1 text-sm text-zinc-300">{scorecardDomainLabel(data.scorecard.strongestDomain)}</p></div>
              <div className="rounded-xl border border-zinc-800 p-3"><p className="text-[11px] uppercase tracking-wide text-zinc-600">Needs protection</p><p className="mt-1 text-sm text-zinc-300">{scorecardDomainLabel(data.scorecard.neglectedDomain)}</p></div>
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-500">{data.scorecard.recommendation}</p>
          </Card>

          <Card>
            <CardHeader title="Stale Someday review" subtitle="Tasks untouched for 90+ days deserve an explicit decision." />
            {data.staleBacklog.length === 0 ? (
              <p className="text-sm text-zinc-500">Nothing stale. Your Someday list is reasonably current.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {data.staleBacklog.map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-900/60 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-zinc-300">{task.title}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-600">Untouched for about {daysOld(task.updated_at)} days</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="secondary" disabled={isPending} onClick={() => startTransition(async () => { await promoteToWeekAction(task.id); load(); })}>→ Week</Button>
                      <Button size="sm" variant="ghost" disabled={isPending} onClick={() => startTransition(async () => { await dropTaskAction(task.id); load(); })}>Drop</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Decision log" subtitle="Record important choices, then compare your reasoning with what actually happened." />
            {!data.decisionLogReady ? (
              <p className="text-xs text-amber-300/80">Apply migration 0018 to activate the decision log.</p>
            ) : (
              <>
                <div className="grid gap-2">
                  <input value={decision} onChange={(e) => setDecision(e.target.value)} placeholder="Decision…" className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200" />
                  <textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="Context (optional)" rows={2} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200" />
                  <textarea value={reasoning} onChange={(e) => setReasoning(e.target.value)} placeholder="Why this seems right" rows={2} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200" />
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-[11px] text-zinc-500">Confidence %<input type="number" min="0" max="100" value={confidence} onChange={(e) => setConfidence(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-sm text-zinc-200" /></label>
                    <label className="text-[11px] text-zinc-500">Review date<input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-sm text-zinc-200" /></label>
                  </div>
                  <div><Button size="sm" disabled={isPending || !decision.trim()} onClick={addDecision}>{isPending ? "Saving…" : "Record decision"}</Button></div>
                </div>

                {data.decisions.length > 0 && (
                  <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
                    {data.decisions.map((item) => {
                      const id = String(item.id);
                      const outcome = typeof item.actual_outcome === "string" ? item.actual_outcome : null;
                      return (
                        <div key={id} className="rounded-xl bg-zinc-900/60 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div><p className="text-sm text-zinc-200">{String(item.decision)}</p><p className="mt-1 text-[11px] text-zinc-600">{String(item.decided_at)}{item.confidence != null ? ` · ${String(item.confidence)}% confidence` : ""}</p></div>
                            {item.review_date && <span className="text-[10px] text-zinc-600">Review {String(item.review_date)}</span>}
                          </div>
                          {item.reasoning && <p className="mt-2 text-xs leading-5 text-zinc-500">{String(item.reasoning)}</p>}
                          {outcome ? <p className="mt-2 rounded-lg border border-zinc-800 px-2.5 py-2 text-xs text-zinc-400">Outcome: {outcome}</p> : (
                            <div className="mt-2 flex gap-2">
                              <input value={outcomes[id] ?? ""} onChange={(e) => setOutcomes((current) => ({ ...current, [id]: e.target.value }))} placeholder="What actually happened?" className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-xs text-zinc-300" />
                              <Button size="sm" variant="secondary" disabled={isPending || !(outcomes[id] ?? "").trim()} onClick={() => startTransition(async () => { const result = await recordDecisionOutcomeAction({ id, actualOutcome: outcomes[id] }); if (!result.ok) setError(result.error ?? "Outcome could not be saved."); else load(); })}>Save outcome</Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
