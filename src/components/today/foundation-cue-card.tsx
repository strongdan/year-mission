"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Wind } from "lucide-react";
import { foundationCueForHour, type FoundationCue } from "@/domain/foundational-protocols";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

const FALLBACK_CUE: FoundationCue = {
  id: "day-walk",
  title: "Choose one useful foundation",
  detail: "Outdoor light, a short walk, or a brief stress reset are all available without creating another obligation.",
  href: "/execute",
};

export function FoundationCueCard() {
  const [cue, setCue] = useState<FoundationCue>(FALLBACK_CUE);

  useEffect(() => {
    const refreshCue = () => setCue(foundationCueForHour(new Date().getHours()));
    refreshCue();
    const timer = window.setInterval(refreshCue, 15 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

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
