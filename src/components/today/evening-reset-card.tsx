"use client";

import { useMemo, useState } from "react";
import { Moon, Check } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getEveningResetForDate } from "@/domain/evening-reset";
import type { EveningResetCompletion } from "@/domain/evening-reset";
import { logEveningResetAction } from "@/app/actions";

interface EveningResetCardProps {
  completion: EveningResetCompletion | null;
  variantName?: string | null;
  date?: Date;
  onChange?: () => void;
}

export function EveningResetCard({ completion, date, onChange }: EveningResetCardProps) {
  const [busy, setBusy] = useState<EveningResetCompletion | null>(null);
  const today = useMemo(() => date ?? new Date(), [date]);
  const variant = useMemo(() => getEveningResetForDate(today), [today]);

  async function handle(completionValue: EveningResetCompletion) {
    if (busy) return;
    setBusy(completionValue);
    const res = await logEveningResetAction({ completion: completionValue, variant: variant.name });
    setBusy(null);
    if (res.ok) onChange?.();
  }

  const detail =
    variant.sequence?.join(" · ") ??
    variant.focus?.join(" · ") ??
    variant.characteristics?.join(" · ") ??
    "";

  return (
    <Card className={completion ? "border-zinc-700" : undefined}>
      <CardHeader
        title="Evening Reset"
        subtitle={`${variant.name} · Target ${variant.targetDuration} · Floor ${variant.floorDuration}`}
        right={<Moon className="h-4 w-4 text-zinc-500" />}
      />
      {detail && <p className="text-xs leading-relaxed text-zinc-400">{detail}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {(["target", "floor", "skipped"] as const).map((v) => {
          const active = completion === v;
          const label = v === "target" ? "Target done" : v === "floor" ? "Floor (5 min)" : "Skipped";
          return (
            <Button
              key={v}
              size="sm"
              variant={active ? "primary" : "secondary"}
              disabled={!!busy}
              onClick={() => handle(v)}
            >
              {busy === v ? "Saving…" : active ? (
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> {label}
                </span>
              ) : (
                label
              )}
            </Button>
          );
        })}
      </div>
      {completion && (
        <p className="mt-2 text-xs text-zinc-500">
          {completion === "target" ? "Target counts fully — no shame in the floor either." : completion === "floor" ? "Floor preserves continuity. Counts as useful." : "Logged as skipped — no momentum penalty."}
        </p>
      )}
    </Card>
  );
}
