"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity } from "lucide-react";
import {
  getMovementVarietyAction,
  logMovementActivityAction,
  saveMovementPreferencesAction,
  type MovementVarietyView,
} from "@/app/movement-actions";
import { movementRecencyLabel, type MovementActivity } from "@/domain/movement-variety";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

function localDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function quietLabel(days: number | null): string {
  if (days === null) return "You haven’t logged one of these outings yet.";
  if (days === 0) return "You got some movement today.";
  if (days === 1) return "You got some movement yesterday.";
  return `It’s been ${days} days since you logged a movement outing.`;
}

export function MovementVarietyCard() {
  const today = useMemo(() => localDateString(), []);
  const [view, setView] = useState<MovementVarietyView | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getMovementVarietyAction(today).then((result) => {
      if (!active) return;
      if (result.ok) setView(result.data);
      else setError(result.error);
    });
    return () => { active = false; };
  }, [today]);

  async function log(activity: MovementActivity) {
    if (busy) return;
    setBusy(activity);
    setError(null);
    setMessage(null);
    const result = await logMovementActivityAction({ activity, happenedOn: today });
    if (result.ok) {
      setView(result.data);
      setMessage("Logged. That counts.");
    } else {
      setError(result.error);
    }
    setBusy(null);
  }

  async function saveSettings(next: { enabled?: boolean; nudgeAfterDays?: number }) {
    if (!view || busy) return;
    const enabled = next.enabled ?? view.enabled;
    const nudgeAfterDays = next.nudgeAfterDays ?? view.nudgeAfterDays;
    setBusy("settings");
    setError(null);
    setMessage(null);
    const result = await saveMovementPreferencesAction({ enabled, nudgeAfterDays }, today);
    if (result.ok) {
      setView(result.data);
      setMessage("Movement reminder settings updated.");
    } else {
      setError(result.error);
    }
    setBusy(null);
  }

  if (!view || !view.ready || !view.snapshot) return null;

  const snapshot = view.snapshot;
  const recommendation = snapshot.recommendation;

  return (
    <div className="px-4 pb-4">
      <Card>
        <CardHeader
          title="Movement menu"
          subtitle="Don’t optimize it. Pick an option that sounds good enough to get you out of the house or moving."
          right={<Activity className="h-4 w-4 text-zinc-500" />}
        />

        <div className={snapshot.overdue
          ? "rounded-xl border border-amber-900/60 bg-amber-950/15 p-3"
          : "rounded-xl border border-zinc-800 bg-zinc-950/30 p-3"}
        >
          <p className="text-xs text-zinc-400">{quietLabel(snapshot.daysSinceAny)}</p>
          {view.enabled && snapshot.overdue ? (
            <>
              <p className="mt-1 text-sm font-medium text-zinc-100">How about: {recommendation.label}?</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">No exercise debt and no streak to repair. Variety is the point. A short version still counts.</p>
              <Button className="mt-3" size="sm" onClick={() => void log(recommendation.id)} disabled={busy !== null}>
                {busy === recommendation.id ? "Logging…" : `I did ${recommendation.short.toLowerCase()} today`}
              </Button>
            </>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">Keep the menu visible so the enjoyable options don’t disappear behind work and errands.</p>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {snapshot.options.filter((option) => option.id !== "other").map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => void log(option.id)}
              disabled={busy !== null}
              className="rounded-xl border border-zinc-800 bg-zinc-950/25 px-3 py-2 text-left transition hover:border-zinc-700 hover:bg-zinc-900/60 disabled:opacity-50"
            >
              <span className="block text-sm font-medium text-zinc-200">{option.short}</span>
              <span className="mt-0.5 block text-[11px] text-zinc-500">{movementRecencyLabel(option.daysSince)}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span>Remind me in-app after</span>
          <select
            value={view.nudgeAfterDays}
            disabled={busy !== null}
            onChange={(event) => void saveSettings({ nudgeAfterDays: Number(event.target.value) })}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-300 outline-none"
            aria-label="Quiet days before movement reminder"
          >
            {[1, 2, 3, 4, 5, 7].map((days) => <option key={days} value={days}>{days} day{days === 1 ? "" : "s"}</option>)}
          </select>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void saveSettings({ enabled: !view.enabled })}
            className="rounded-lg border border-zinc-800 px-2 py-1 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-50"
          >
            {view.enabled ? "Nudges on" : "Nudges off"}
          </button>
        </div>

        {message && <p className="mt-3 text-xs text-emerald-400">{message}</p>}
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      </Card>
    </div>
  );
}
