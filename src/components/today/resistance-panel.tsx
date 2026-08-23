"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CalendarClock, CheckCircle2, Scissors, ShieldAlert } from "lucide-react";
import { deferTaskAction, dropTaskAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import type { DeferralReason } from "@/domain/constants";
import type { Task } from "@/types/models";

const REASONS: { value: DeferralReason; label: string; hint: string }[] = [
  { value: "just_avoiding", label: "Just avoiding it", hint: "I could do it, but I do not feel like starting." },
  { value: "too_big", label: "Feels too big", hint: "The task has too much activation energy." },
  { value: "no_energy", label: "Low energy", hint: "The full version is unrealistic right now." },
  { value: "competing_priority", label: "Truly busy", hint: "Something more important is consuming the available capacity." },
  { value: "dont_know_how", label: "Not sure how", hint: "Uncertainty is blocking the first move." },
  { value: "blocked", label: "Blocked", hint: "Something external must happen first." },
  { value: "not_important", label: "Maybe not important", hint: "This may not deserve to stay on the list." },
];

function minimumHref(task: Task): string {
  const title = task.title.toLowerCase();
  const id = encodeURIComponent(task.id);
  if (/lift|strength|weights|resistance training/.test(title)) return `/execute/strength-quick?taskId=${id}`;
  if (/stretch|mobility/.test(title)) return `/execute/evening-mobility?taskId=${id}`;
  if (/meditat|mindful|breath/.test(title)) return `/execute/meditation?minutes=5&taskId=${id}`;
  if (/hypno|self.?hypnosis/.test(title)) return `/execute/hypnosis?taskId=${id}`;
  return `/execute/focus?minutes=5&taskId=${id}`;
}

export function ResistancePanel({ task, onChange, onClose }: { task: Task; onChange: () => void; onClose: () => void }) {
  const [reason, setReason] = useState<DeferralReason | null>(null);
  const [busy, setBusy] = useState(false);

  async function defer() {
    if (!reason || busy) return;
    setBusy(true);
    await deferTaskAction(task.id, reason);
    setBusy(false);
    onClose();
    onChange();
  }

  async function drop() {
    if (busy) return;
    setBusy(true);
    await dropTaskAction(task.id);
    setBusy(false);
    onClose();
    onChange();
  }

  const startFirst = reason === "just_avoiding" || reason === "too_big" || reason === "no_energy" || reason === "dont_know_how";

  return (
    <Card className="border-orange-900/50 bg-orange-950/10">
      <CardHeader title="What is the friction?" subtitle="Deferring is allowed. The app just tries to distinguish capacity from avoidance first." />
      {!reason ? (
        <div className="flex flex-col gap-2">
          {REASONS.map((item) => (
            <button key={item.value} onClick={() => setReason(item.value)} className="rounded-xl border border-zinc-800 bg-zinc-950/35 px-3 py-2.5 text-left transition-colors hover:border-zinc-700">
              <p className="text-sm font-medium text-zinc-300">{item.label}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-600">{item.hint}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {startFirst && (
            <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/10 p-3">
              <div className="flex items-start gap-2"><Scissors className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /><div><p className="text-sm font-medium text-zinc-200">Shrink the commitment before moving it</p><p className="mt-1 text-xs leading-relaxed text-zinc-500">You only have to start the minimum version. Finishing is a separate decision.</p></div></div>
              <Link href={minimumHref(task)} className="mt-3 flex items-center justify-between rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-emerald-950">Start minimum version <ArrowRight className="h-4 w-4" /></Link>
            </div>
          )}

          {reason === "competing_priority" && <div className="flex items-start gap-2 rounded-xl border border-sky-900/40 bg-sky-950/10 p-3"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" /><p className="text-xs leading-relaxed text-zinc-400">A genuinely overloaded day is not procrastination. Renegotiate this task deliberately so the higher-priority work gets protected.</p></div>}
          {reason === "blocked" && <div className="flex items-start gap-2 rounded-xl border border-amber-900/40 bg-amber-950/10 p-3"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" /><p className="text-xs leading-relaxed text-zinc-400">This will record the blocker signal and move the task back to This Week rather than repeatedly presenting an impossible start.</p></div>}
          {reason === "not_important" && <div className="flex items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" /><p className="text-xs leading-relaxed text-zinc-400">Removing work that no longer matters is better than rehearsing avoidance every day.</p></div>}

          <div className="flex flex-wrap gap-2">
            {reason === "not_important" ? <Button variant="danger" size="sm" onClick={drop} disabled={busy}>Drop task</Button> : <Button variant={startFirst ? "secondary" : "primary"} size="sm" onClick={defer} disabled={busy}>{reason === "competing_priority" ? "Defer deliberately" : reason === "blocked" ? "Record blocker & defer" : "Defer anyway"}</Button>}
            {reason === "not_important" && <Button variant="secondary" size="sm" onClick={defer} disabled={busy}>Keep for This Week</Button>}
            <Button variant="ghost" size="sm" onClick={() => setReason(null)} disabled={busy}>Back</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
