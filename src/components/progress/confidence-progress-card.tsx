"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { getConversationConfidenceAction } from "@/app/conversation-confidence-actions";
import { Card, CardHeader } from "@/components/ui/card";

type View = NonNullable<Awaited<ReturnType<typeof getConversationConfidenceAction>>["data"]>;

export function ConfidenceProgressCard() {
  const [view, setView] = useState<View | null>(null);

  useEffect(() => {
    let active = true;
    void getConversationConfidenceAction().then((result) => {
      if (active && result.ok && result.data.path.active) setView(result.data);
    });
    return () => { active = false; };
  }, []);

  if (!view) return null;

  const summary = view.summary;
  const phase = view.monday.phase;

  return (
    <div className="px-4 pb-4">
      <Card className="border-violet-950/70 bg-violet-950/10">
        <CardHeader
          title="Confidence evidence"
          subtitle={phase.title + " · Month " + view.month.number + " of 12"}
          right={<Sparkles className="h-4 w-4 text-violet-400" />}
        />
        <p className="text-sm leading-relaxed text-zinc-300">{phase.edge}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <EvidenceStat label="Real-world reps" value={summary.total} />
          <EvidenceStat label="Fear did not happen" value={summary.fearedOutcomeDidNotHappen} />
          <EvidenceStat label="Awkward and handled" value={summary.awkwardAndHandled} />
          <EvidenceStat label="Disapproval handled" value={summary.disapprovalAndHandled} />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
          These are observations, not a confidence score. The aim is accumulated evidence that you can act and recover.
        </p>
      </Card>
    </div>
  );
}

function EvidenceStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/25 p-3">
      <p className="text-lg font-semibold text-zinc-100">{value}</p>
      <p className="mt-1 text-[11px] leading-tight text-zinc-500">{label}</p>
    </div>
  );
}
