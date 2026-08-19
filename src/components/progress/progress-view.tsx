"use client";

import { useEffect, useState } from "react";
import {
  getDashboardAction,
  setWeekModeAction,
  setWeeklyWinAction,
  saveWeeklyReviewAction,
  createExperimentAction,
  concludeExperimentAction,
  createIdeaAction,
  resolveIdeaAction,
} from "@/app/actions";
import { Card, CardHeader } from "@/components/ui/card";
import { ProgressBar, MomentumRing } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingDown, Flag, FlaskConical, Lightbulb } from "lucide-react";
import type { WeekMode } from "@/domain/constants";
import { LogProgress } from "./log-progress";

type DashboardData = NonNullable<Awaited<ReturnType<typeof getDashboardAction>>["data"]>;

const WEEK_MODES: { value: WeekMode; label: string; hint: string }[] = [
  { value: "push", label: "Push", hint: "Capacity is high — go hard." },
  { value: "normal", label: "Normal", hint: "Standard week." },
  { value: "maintenance", label: "Maintenance", hint: "Hold the line, fewer adds." },
  { value: "recovery", label: "Recovery", hint: "Lower the bar, rest, bounce back." },
];

function MomentumGraph({ history }: { history: DashboardData["momentumHistory"] }) {
  const points = [...history].reverse().slice(-14);
  if (points.length < 2) return null;
  const values = points.map((p) => p.overall_score);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 280;
  const h = 60;
  const coords = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (w - 8) + 4;
    const y = h - 8 - ((v - min) / range) * (h - 16);
    return [x, y] as const;
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${coords[coords.length - 1][0].toFixed(1)},${h - 4} L${coords[0][0].toFixed(1)},${h - 4} Z`;

  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        <path d={area} className="fill-sky-900/30" />
        <path d={path} className="fill-none stroke-sky-400" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
        <span>{points[0].date.slice(5)}</span>
        <span>{points[points.length - 1].date.slice(5)}</span>
      </div>
    </div>
  );
}

export function ProgressView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weekMode, setWeekMode] = useState<WeekMode | null>(null);
  const [weekModeBusy, setWeekModeBusy] = useState(false);
  const [weeklyWin, setWeeklyWin] = useState<string | null>(null);
  const [weeklyWinBusy, setWeeklyWinBusy] = useState(false);

  const [reviewWins, setReviewWins] = useState("");
  const [reviewDifficulties, setReviewDifficulties] = useState("");
  const [reviewWhy, setReviewWhy] = useState("");
  const [reviewStop, setReviewStop] = useState("");
  const [reviewOvercommit, setReviewOvercommit] = useState<"yes" | "no" | null>(null);
  const [reviewNextWin, setReviewNextWin] = useState("");
  const [reviewActions, setReviewActions] = useState<Record<string, string>>({ money: "", body: "", home: "", capability: "" });
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);

  const [expTitle, setExpTitle] = useState("");
  const [expMetric, setExpMetric] = useState("");
  const [expDays, setExpDays] = useState("21");
  const [expBusy, setExpBusy] = useState(false);
  const [concludingId, setConcludingId] = useState<string | null>(null);

  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaBusy, setIdeaBusy] = useState(false);

  function applyReview(review: DashboardData["weeklyReview"]) {
    if (!review) return;
    const wins = review.wins;
    const difficulties = review.difficulties;
    const stop = review.stop_doing;
    const actions = review.most_important_actions;
    setReviewWins(Array.isArray(wins) ? (wins as string[]).join("\n") : "");
    setReviewDifficulties(Array.isArray(difficulties) ? (difficulties as string[]).join("\n") : "");
    setReviewWhy(review.why_not ?? "");
    setReviewStop(Array.isArray(stop) ? (stop as string[]).join("\n") : "");
    setReviewOvercommit(review.overcommitted == null ? null : review.overcommitted ? "yes" : "no");
    setReviewNextWin(review.next_weekly_win ?? "");
    if (actions && typeof actions === "object") {
      const next: Record<string, string> = { money: "", body: "", home: "", capability: "" };
      for (const [k, v] of Object.entries(actions)) {
        if (typeof v === "string") next[k] = v;
      }
      setReviewActions(next);
    }
  }

  async function load() {
    const res = await getDashboardAction();
    if (!res.ok || !res.data) {
      setError(res.error ?? "Failed to load.");
      return;
    }
    setData(res.data);
    setWeekMode(res.data.weekMode);
    setWeeklyWin(res.data.weeklyReview?.weekly_win_id ?? res.data.weeklyWins[0]?.id ?? null);
    applyReview(res.data.weeklyReview);
  }

  useEffect(() => {
    let cancelled = false;
    getDashboardAction().then((res) => {
      if (cancelled) return;
      if (!res.ok || !res.data) {
        setError(res.error ?? "Failed to load.");
        return;
      }
      setData(res.data);
      setWeekMode(res.data.weekMode);
      setWeeklyWin(res.data.weeklyReview?.weekly_win_id ?? res.data.weeklyWins[0]?.id ?? null);
      applyReview(res.data.weeklyReview);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <div className="p-4 text-sm text-zinc-400">{error}</div>;
  if (!data) return <div className="p-4 text-sm text-zinc-500">Loading…</div>;

  const latestDebt = data.financial[0]?.consumer_debt ?? null;
  const weight = data.todayCheckin?.weight ?? null;
  const activeExperiments = data.experiments.filter((e) => e.status === "active");
  const pastExperiments = data.experiments.filter((e) => e.status === "completed" || e.status === "abandoned");
  const parkingLot = data.ideas.filter((i) => i.status !== "deleted");

  async function pickWeekMode(mode: WeekMode) {
    setWeekModeBusy(true);
    await setWeekModeAction(mode);
    setWeekMode(mode);
    setWeekModeBusy(false);
  }

  async function pickWeeklyWin(taskId: string) {
    setWeeklyWinBusy(true);
    await setWeeklyWinAction(taskId);
    setWeeklyWin(taskId);
    setWeeklyWinBusy(false);
  }

  async function saveReview() {
    setReviewBusy(true);
    const wins = reviewWins.split("\n").map((s) => s.trim()).filter(Boolean);
    const difficulties = reviewDifficulties.split("\n").map((s) => s.trim()).filter(Boolean);
    const stopDoing = reviewStop.split("\n").map((s) => s.trim()).filter(Boolean);
    const mostImportantActions = Object.fromEntries(
      Object.entries(reviewActions).filter(([, v]) => v.trim())
    );
    const res = await saveWeeklyReviewAction({
      wins,
      difficulties,
      why: reviewWhy,
      stopDoing,
      overcommitted: reviewOvercommit === "yes" ? true : reviewOvercommit === "no" ? false : null,
      nextWeeklyWin: reviewNextWin,
      mostImportantActions,
    });
    setReviewBusy(false);
    if (res.ok) {
      setReviewSaved(true);
      setTimeout(() => setReviewSaved(false), 2000);
    } else {
      setError(res.error ?? "Failed to save.");
    }
  }

  async function createExperiment() {
    if (!expTitle.trim() || expBusy) return;
    setExpBusy(true);
    const startDate = new Date().toISOString().slice(0, 10);
    const plannedEnd = new Date(Date.now() + Number(expDays) * 86400000).toISOString().slice(0, 10);
    const res = await createExperimentAction({
      title: expTitle,
      targetMetric: expMetric || undefined,
      startDate,
      plannedEndDate: plannedEnd,
    });
    setExpBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Failed to create experiment.");
      return;
    }
    setExpTitle("");
    setExpMetric("");
    load();
  }

  async function conclude(id: string, decision: "keep" | "modify" | "abandon") {
    setConcludingId(id);
    await concludeExperimentAction(id, decision);
    setConcludingId(null);
    load();
  }

  async function createIdea() {
    if (!ideaTitle.trim() || ideaBusy) return;
    setIdeaBusy(true);
    await createIdeaAction({ title: ideaTitle });
    setIdeaBusy(false);
    setIdeaTitle("");
    load();
  }

  async function moveIdeaToTask(ideaId: string) {
    await resolveIdeaAction(ideaId, "active");
    load();
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header>
        <h1 className="text-xl font-semibold">Progress</h1>
        <p className="text-xs text-zinc-500">Evidence of change, not a leaderboard.</p>
      </header>

      {data.overcommit.isOvercommitted && (
        <Card className="border-red-900/60">
          <div className="flex items-start gap-2">
            <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-300">Overcommitment detected</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                You&apos;ve made {data.overcommit.made} commitments recently and kept {data.overcommit.kept}. Try capping
                this week at {data.overcommit.recommendedCap} to rebuild trust with yourself.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Week mode" subtitle="Shape the bar before the week happens." />
        <div className="grid grid-cols-2 gap-2">
          {WEEK_MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => pickWeekMode(m.value)}
              disabled={weekModeBusy}
              className={`rounded-xl border px-3 py-2.5 text-left transition-colors disabled:opacity-50 ${
                weekMode === m.value ? "border-zinc-300 bg-zinc-100 text-zinc-950" : "border-zinc-800 bg-zinc-900 text-zinc-300"
              }`}
            >
              <p className="text-sm font-medium">{m.label}</p>
              <p className={`mt-0.5 text-[11px] ${weekMode === m.value ? "text-zinc-600" : "text-zinc-500"}`}>{m.hint}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Momentum" subtitle={data.momentumLabel} />
        <div className="flex items-center gap-4">
          <MomentumRing score={data.momentum} size={80} />
          <div className="flex-1">
            <p className="text-xs leading-relaxed text-zinc-500">
              Rolling 14-day average of the Big Four and meaningful completion. It recovers quickly and never punishes a
              bad day.
            </p>
          </div>
        </div>
        <MomentumGraph history={data.momentumHistory} />
      </Card>

      <Card>
        <CardHeader title="Weekly win" subtitle="One high-impact thing you commit to landing this week." />
        {data.weeklyCommitments.length > 0 ? (
          <div className="flex flex-col gap-2">
            {data.weeklyCommitments.slice(0, 8).map((t) => (
              <button
                key={t.id}
                onClick={() => pickWeeklyWin(t.id)}
                disabled={weeklyWinBusy}
                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-50 ${
                  weeklyWin === t.id ? "border-amber-700 bg-amber-950/40 text-amber-100" : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <span className="min-w-0 truncate">{t.title}</span>
                {weeklyWin === t.id && <Flag className="h-4 w-4 shrink-0 text-amber-400" />}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Add tasks to This Week on the Tasks screen to pick a win.</p>
        )}
      </Card>

      <LogProgress checkin={data.todayCheckin} debt={data.financial[0] ?? null} house={data.houseReadinessDate ? { id: "latest", user_id: "", date: data.houseReadinessDate, readiness_score: data.houseReadiness ?? 0, notes: null } : null} onSaved={load} />

      <Card>
        <CardHeader title="Reliability" subtitle="Do I do what I say I will do?" />
        <div className="flex items-end gap-3">
          <span className="text-4xl font-semibold">{data.reliability ?? "—"}</span>
          <span className="pb-1 text-sm text-zinc-500">%</span>
        </div>
        {data.reliability !== null && <p className="mt-2 text-xs leading-relaxed text-zinc-500">{data.reliabilityInterpretation}</p>}
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-zinc-400">
          <span className="rounded-full bg-zinc-800 px-2 py-1">Agency: {data.agency}</span>
        </div>
      </Card>

      <Card>
        <CardHeader title="Domains" />
        <div className="grid grid-cols-2 gap-3">
          {data.domains.map((d) => (
            <div key={d.id} className="rounded-xl bg-zinc-800/50 p-3">
              <p className="text-sm font-medium capitalize">{d.slug}</p>
              <p className="mt-1 text-[11px] capitalize text-zinc-500">{d.current_level}</p>
              <ProgressBar value={d.progress_score} max={100} className="mt-2" />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Key metrics" />
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-zinc-800/50 p-3">
            <p className="text-xs text-zinc-500">Consumer debt</p>
            <p className="mt-1 font-medium">{latestDebt === null ? "—" : `$${latestDebt.toLocaleString()}`}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 p-3">
            <p className="text-xs text-zinc-500">Weight</p>
            <p className="mt-1 font-medium">{weight === null ? "—" : `${weight} lb`}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 p-3">
            <p className="text-xs text-zinc-500">Steps today</p>
            <p className="mt-1 font-medium">{data.stepsToday === null ? "—" : data.stepsToday.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 p-3">
            <p className="text-xs text-zinc-500">Workouts this week</p>
            <p className="mt-1 font-medium">{data.workouts.length}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 p-3">
            <p className="text-xs text-zinc-500">House readiness</p>
            <p className="mt-1 font-medium">{data.houseReadiness === null ? "—" : `${data.houseReadiness}%`}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 p-3">
            <p className="text-xs text-zinc-500">Alcohol-free days</p>
            <p className="mt-1 font-medium">{data.alcoholFreeDays}</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Experiments" subtitle="Max two active — a pursuit with a metric, not an obligation." right={<FlaskConical className="h-4 w-4 text-zinc-600" />} />
        <div className="flex flex-col gap-3">
          {activeExperiments.map((e) => (
            <div key={e.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-zinc-200">{e.title}</p>
                <span className="rounded-full bg-sky-950/60 px-2 py-0.5 text-[10px] text-sky-300">active</span>
              </div>
              {e.target_metric && <p className="mt-1 text-xs text-zinc-500">Target: {e.target_metric}</p>}
              <p className="mt-1 text-[11px] text-zinc-600">
                {e.start_date} → {e.planned_end_date ?? "open"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => conclude(e.id, "keep")} disabled={concludingId === e.id}>
                  Keep
                </Button>
                <Button size="sm" variant="secondary" onClick={() => conclude(e.id, "modify")} disabled={concludingId === e.id}>
                  Modify
                </Button>
                <Button size="sm" variant="danger" onClick={() => conclude(e.id, "abandon")} disabled={concludingId === e.id}>
                  Abandon
                </Button>
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-2 rounded-xl border border-dashed border-zinc-800 p-3">
            <p className="text-xs font-medium text-zinc-400">Start a new experiment</p>
            <input
              value={expTitle}
              onChange={(e) => setExpTitle(e.target.value)}
              placeholder="e.g. Daily 10-min mobility"
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
            <input
              value={expMetric}
              onChange={(e) => setExpMetric(e.target.value)}
              placeholder="Target metric (e.g. 10 sessions)"
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
            <div className="flex items-center gap-2">
              <input
                value={expDays}
                onChange={(e) => setExpDays(e.target.value)}
                type="number"
                min={1}
                className="w-16 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
              />
              <span className="text-xs text-zinc-500">days</span>
              <div className="flex-1" />
              <Button size="sm" onClick={createExperiment} disabled={expBusy || !expTitle.trim() || activeExperiments.length >= 2}>
                Start
              </Button>
            </div>
            {activeExperiments.length >= 2 && <p className="text-[11px] text-amber-400">Two active max — keep, modify, or abandon one first.</p>}
          </div>

          {pastExperiments.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {pastExperiments.slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-zinc-400">{e.title}</span>
                  <span className="shrink-0 capitalize text-zinc-600">{e.decision ?? e.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Parking lot" subtitle="Capture ideas; decide later." right={<Lightbulb className="h-4 w-4 text-zinc-600" />} />
        <div className="flex flex-col gap-2">
          {parkingLot.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {parkingLot.slice(0, 8).map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-2 rounded-xl bg-zinc-800/50 px-3 py-2">
                  <span className="min-w-0 truncate text-sm text-zinc-300">{i.title}</span>
                  <div className="flex shrink-0 gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => moveIdeaToTask(i.id)}>
                      Activate
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => resolveIdeaAction(i.id, "deleted").then(load)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={ideaTitle}
              onChange={(e) => setIdeaTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createIdea()}
              placeholder="Capture an idea…"
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
            <Button size="sm" onClick={createIdea} disabled={ideaBusy || !ideaTitle.trim()}>
              Save
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Weekly review" subtitle="Ten minutes. What happened, why, and what's next." />
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">What went well? (one per line)</label>
            <textarea
              value={reviewWins}
              onChange={(e) => setReviewWins(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">What didn&apos;t happen? (one per line)</label>
            <textarea
              value={reviewDifficulties}
              onChange={(e) => setReviewDifficulties(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Why didn&apos;t it happen?</label>
            <textarea
              value={reviewWhy}
              onChange={(e) => setReviewWhy(e.target.value)}
              rows={2}
              placeholder="Energy, blockers, overreach, avoidance…"
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">What should I stop doing? (one per line)</label>
            <textarea
              value={reviewStop}
              onChange={(e) => setReviewStop(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Did I overcommit?</label>
            <div className="mt-1 flex gap-2">
              {(["yes", "no"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setReviewOvercommit(reviewOvercommit === v ? null : v)}
                  className={`rounded-full border px-3 py-1.5 text-xs capitalize transition-colors ${
                    reviewOvercommit === v ? "border-zinc-300 bg-zinc-100 text-zinc-950" : "border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Next week&apos;s Weekly Win</label>
            <input
              value={reviewNextWin}
              onChange={(e) => setReviewNextWin(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Most important action per domain</label>
            {(["money", "body", "home", "capability"] as const).map((d) => (
              <input
                key={d}
                value={reviewActions[d]}
                onChange={(e) => setReviewActions((prev) => ({ ...prev, [d]: e.target.value }))}
                placeholder={`${d.charAt(0).toUpperCase() + d.slice(1)}…`}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm capitalize outline-none placeholder:normal-case placeholder:text-zinc-600 focus:border-zinc-600"
              />
            ))}
          </div>
          <Button onClick={saveReview} disabled={reviewBusy}>
            {reviewSaved ? "Saved ✓" : "Save review"}
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Milestones" />
        {data.milestones.length > 0 ? (
          <div className="flex flex-col gap-2">
            {data.milestones.slice(0, 8).map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-zinc-200">{m.title}</span>
                <span className="shrink-0 text-xs text-zinc-500">{m.achieved_at}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No milestones yet. They&apos;ll appear as you make real-world progress.</p>
        )}
      </Card>

      <Card>
        <CardHeader title="Recent evidence" />
        {data.evidence.length > 0 ? (
          <div className="flex flex-col gap-2">
            {data.evidence.slice(0, 8).map((e) => (
              <div key={e.id} className="flex items-start justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-zinc-200">{e.title}</p>
                  <p className="text-[11px] capitalize text-zinc-500">{e.type}</p>
                </div>
                <span className="shrink-0 text-xs text-zinc-600">{e.occurred_at}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Complete courage tasks and hard things to build evidence.</p>
        )}
      </Card>
    </div>
  );
}