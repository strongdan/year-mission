"use client";

import { useState } from "react";
import { checkinAction, logDebtAction, logWorkoutAction, logHouseProgressAction, recordEvidenceAction } from "@/app/actions";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EvidenceType } from "@/domain/constants";
import type { DailyCheckin, FinancialSnapshot, HouseProgress } from "@/types/models";

const WORKOUT_TYPES = ["lifting", "walking", "running", "cycling", "swimming", "mobility", "other"] as const;

const EVIDENCE_TYPES: { value: EvidenceType; label: string }[] = [
  { value: "career", label: "Career" },
  { value: "home", label: "Home" },
  { value: "fitness", label: "Fitness" },
  { value: "debt", label: "Debt" },
  { value: "sobriety", label: "Sobriety" },
  { value: "courage", label: "Uncomfortable task" },
  { value: "avoidance_overcome", label: "Avoidance overcome" },
  { value: "reliability", label: "Reliability" },
  { value: "milestone", label: "Milestone" },
  { value: "personal_best", label: "Personal best" },
];

interface LogProgressProps {
  checkin: DailyCheckin | null;
  debt: FinancialSnapshot | null;
  house: HouseProgress | null;
  onSaved: () => void;
}

function NumberInput({ label, value, onChange, placeholder, suffix }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; suffix?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</label>
      <div className="flex items-center gap-2">
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
        />
        {suffix && <span className="text-xs text-zinc-500">{suffix}</span>}
      </div>
    </div>
  );
}

export function LogProgress({ checkin, debt, house, onSaved }: LogProgressProps) {
  const [weight, setWeight] = useState(checkin?.weight != null ? String(checkin.weight) : "");
  const [steps, setSteps] = useState(checkin?.steps != null ? String(checkin.steps) : "");
  const [debtValue, setDebtValue] = useState(debt?.consumer_debt != null ? String(debt.consumer_debt) : "");
  const [workoutType, setWorkoutType] = useState<(typeof WORKOUT_TYPES)[number]>("walking");
  const [workoutMinutes, setWorkoutMinutes] = useState("");
  const [houseScore, setHouseScore] = useState(house?.readiness_score != null ? String(house.readiness_score) : "");
  const [evidenceType, setEvidenceType] = useState<EvidenceType>("career");
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, label: string) {
    if (busy) return;
    setBusy(true);
    setSaved(null);
    const res = await fn();
    setBusy(false);
    if (res.ok) {
      setSaved(label);
      setTimeout(() => setSaved(null), 2000);
      onSaved();
    }
  }

  return (
    <Card>
      <CardHeader title="Log progress" subtitle="Evidence of change, recorded in seconds." />

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Body</p>
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Weight (lb)" value={weight} onChange={setWeight} placeholder="e.g. 214" />
            <NumberInput label="Steps today" value={steps} onChange={setSteps} placeholder="e.g. 8200" />
          </div>
          <Button size="sm" variant="secondary" disabled={busy || (!weight && !steps)} onClick={() => run(() => checkinAction({ weight: weight ? Number(weight) : null, steps: steps ? Number(steps) : null }), "Check-in saved")}>
            Save check-in
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Money</p>
          <NumberInput label="Consumer debt" value={debtValue} onChange={setDebtValue} placeholder="e.g. 12400" suffix="$" />
          <Button size="sm" variant="secondary" disabled={busy || !debtValue} onClick={() => run(() => logDebtAction({ consumerDebt: Number(debtValue) }), "Debt saved")}>
            Save debt
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Workout</p>
          <div className="flex flex-wrap gap-1.5">
            {WORKOUT_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setWorkoutType(t)}
                className={`rounded-full border px-2.5 py-1 text-xs capitalize transition-colors ${
                  workoutType === t ? "border-zinc-300 bg-zinc-100 text-zinc-950" : "border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-3">
            <NumberInput label="Minutes" value={workoutMinutes} onChange={setWorkoutMinutes} placeholder="e.g. 45" />
            <Button size="sm" variant="secondary" disabled={busy || !workoutMinutes} onClick={() => run(() => logWorkoutAction({ type: workoutType, durationMinutes: Number(workoutMinutes) }), "Workout logged")}>
              Log workout
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Home</p>
          <div className="flex items-end gap-3">
            <NumberInput label="House readiness (0–100)" value={houseScore} onChange={setHouseScore} placeholder="e.g. 40" />
            <Button size="sm" variant="secondary" disabled={busy || !houseScore} onClick={() => run(() => logHouseProgressAction({ readinessScore: Number(houseScore) }), "House saved")}>
              Save
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Career evidence</p>
          <select
            value={evidenceType}
            onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
          >
            {EVIDENCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            value={evidenceTitle}
            onChange={(e) => setEvidenceTitle(e.target.value)}
            placeholder="What did you actually do?"
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />
          <input
            value={evidenceDescription}
            onChange={(e) => setEvidenceDescription(e.target.value)}
            placeholder="One line of context (optional)"
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />
          <Button size="sm" variant="secondary" disabled={busy || !evidenceTitle.trim()} onClick={() => run(() => recordEvidenceAction({ type: evidenceType, title: evidenceTitle.trim(), description: evidenceDescription.trim() || undefined }), "Evidence recorded")}>
            Record evidence
          </Button>
        </div>
      </div>

      {saved && <p className="mt-3 text-xs text-emerald-400">{saved}</p>}
    </Card>
  );
}