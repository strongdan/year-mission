"use client";

import { Radar } from "lucide-react";
import { BigFourRadar } from "@/components/game/big-four-radar";
import { Card, CardHeader } from "@/components/ui/card";

interface WeeklyValue {
  done: number;
  target: number;
}

interface Props {
  bigFour: Record<string, WeeklyValue>;
}

export function MissionGrowth({ bigFour }: Props) {
  return (
    <Card>
      <CardHeader
        title="Big Four radar"
        subtitle="A weekly game map of what is getting attention — not a demand for perfect balance."
        right={<Radar className="h-4 w-4 text-sky-400" />}
      />
      <BigFourRadar bigFour={bigFour} />
      <p className="mt-4 border-t border-zinc-800 pt-3 text-[11px] leading-relaxed text-zinc-600">
        The shape can be uneven on purpose. Seasons change what deserves emphasis; the radar simply keeps Body, Career, Self, and Money visible.
      </p>
    </Card>
  );
}
