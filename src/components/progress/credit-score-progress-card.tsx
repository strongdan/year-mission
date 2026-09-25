"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { addCreditScoreSnapshotAction, getCreditScoreProgressAction } from "@/app/credit-score-actions";
import { sameCreditSeries } from "@/domain/credit-score";

interface CreditScoreSnapshot {
  id: string;
  score: number;
  bureau: string;
  score_model: string;
  source: string;
  measured_at: string;
  created_at: string;
}

interface ProgressData {
  snapshots: CreditScoreSnapshot[];
  latest: CreditScoreSnapshot | null;
  previous: CreditScoreSnapshot | null;
  delta: number | null;
  best: number | null;
}

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function CreditScoreProgressCard() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [measuredAt, setMeasuredAt] = useState("");

  const load = () => {
    startTransition(async () => {
      const result = await getCreditScoreProgressAction();
      if (!result.ok) setError(result.error);
      else {
        setError(null);
        setData(result.data as ProgressData);
      }
    });
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMeasuredAt(localToday());
      load();
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const trend = useMemo(() => {
    if (!data?.latest) return [];
    return data.snapshots
      .filter((item) => sameCreditSeries(
        { bureau: item.bureau, scoreModel: item.score_model },
        { bureau: data.latest!.bureau, scoreModel: data.latest!.score_model },
      ))
      .slice(0, 12)
      .reverse();
  }, [data]);

  function addScore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await addCreditScoreSnapshotAction({
        score: form.get("score"),
        bureau: form.get("bureau"),
        scoreModel: form.get("scoreModel"),
        measuredAt: form.get("measuredAt"),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });
      if (!result.ok) setError(result.error);
      else load();
    });
  }

  const latest = data?.latest;
  const delta = data?.delta;

  return (
    <section className="mx-4 mb-6 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Money progress</p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-100">Credit score</h2>
          <p className="mt-1 text-xs text-zinc-500">Track comparable snapshots. The model and bureau matter as much as the number.</p>
        </div>
        {latest ? (
          <div className="text-right">
            <div className="text-3xl font-semibold text-zinc-100">{latest.score}</div>
            <div className="text-xs text-zinc-500">
              {delta == null ? "First comparable snapshot" : `${delta > 0 ? "+" : ""}${delta} vs prior`}
            </div>
          </div>
        ) : null}
      </div>

      {latest ? (
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><div className="text-xs text-zinc-500">Model</div><div className="text-zinc-200">{latest.score_model}</div></div>
          <div><div className="text-xs text-zinc-500">Bureau</div><div className="text-zinc-200">{latest.bureau}</div></div>
          <div><div className="text-xs text-zinc-500">Best comparable</div><div className="text-zinc-200">{data?.best ?? latest.score}</div></div>
          <div><div className="text-xs text-zinc-500">Updated</div><div className="text-zinc-200">{latest.measured_at}</div></div>
        </div>
      ) : data === null && pending ? (
        <p className="mt-4 text-sm text-zinc-400">Loading credit score history…</p>
      ) : data === null && error ? null : (
        <p className="mt-4 text-sm text-zinc-400">No score history yet. Add a snapshot if you want this context in Year Mission.</p>
      )}

      {trend.length > 1 ? (
        <>
          <div className="mt-4 flex items-end gap-1 rounded-xl bg-zinc-900/60 p-3" aria-hidden="true">
            {trend.map((item) => {
              const height = Math.max(12, Math.min(64, 12 + (item.score - 600) * 0.16));
              return <div key={item.id} className="min-w-2 flex-1 rounded-sm bg-zinc-500" style={{ height }} />;
            })}
          </div>
          <div className="mt-2">
            <p className="text-[11px] font-medium text-zinc-500">Comparable history</p>
            <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-600">
              {trend.map((item) => <li key={`history-${item.id}`}><span>{item.measured_at}</span>: <span>{item.score}</span></li>)}
            </ul>
          </div>
        </>
      ) : null}

      <form onSubmit={addScore} className="mt-5 grid gap-2 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-[11px] text-zinc-500">
          Score
          <input name="score" type="number" min={300} max={850} required placeholder="742" className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-zinc-500">
          Bureau
          <input name="bureau" required placeholder="Experian" className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-zinc-500">
          Score model
          <input name="scoreModel" required placeholder="VantageScore 3.0" className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" />
        </label>
        <div className="flex items-end gap-2">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-[11px] text-zinc-500">
            Measurement date
            <input name="measuredAt" type="date" value={measuredAt} max={measuredAt || undefined} onChange={(event) => setMeasuredAt(event.target.value)} required disabled={!measuredAt} className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-2 text-sm text-zinc-100 disabled:opacity-60" />
          </label>
          <button disabled={pending} className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50">Add</button>
        </div>
      </form>

      <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
        Year Mission compares only snapshots with the same bureau and score model. A different scoring model is a separate series, not an improvement or decline.
      </p>
      {error ? <p role="alert" aria-live="polite" className="mt-3 text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
