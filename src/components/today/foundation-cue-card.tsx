"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Sparkles, Wind } from "lucide-react";
import { foundationCueForHour } from "@/domain/foundational-protocols";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

export function FoundationCueCard() {
  const cue = useMemo(() => foundationCueForHour(new Date().getHours()), []);

  return (
    <Card className="border-sky-950/70 bg-sky-950/10">
      <CardHeader
        title="Foundation cue"
        subtitle="One physiology-friendly option. Use it when useful; ignore it when it is not."
        right={<Sparkles className="h-4 w-4 text-sky-400" />}
      />
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/25 p-3">
        <p className="text-sm font-medium text-zinc-200">{cue.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">{cue.detail}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={cue.href}>
            <Button size="sm">
              Start <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link href="/execute/calm-breathing">
            <Button size="sm" variant="secondary">
              <Wind className="mr-1 h-3.5 w-3.5" /> Stress reset
            </Button>
          </Link>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
        No streak, score, supplement stack, or catch-up requirement. Foundations before optimization.
      </p>
    </Card>
  );
}
