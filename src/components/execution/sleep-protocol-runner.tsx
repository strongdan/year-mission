"use client";

import Link from "next/link";
import { ArrowLeft, Moon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AWAKE_AT_NIGHT_STEPS, SLEEP_ANCHORS } from "@/domain/sleep-support";

export function SleepProtocolRunner({ mode }: { mode: "wind-down" | "awake-at-night" }) {
  if (mode === "awake-at-night") {
    return (
      <div className="flex flex-col gap-4 p-4 pb-8">
        <Link href="/execute" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200">
          <ArrowLeft className="h-3.5 w-3.5" /> Routines
        </Link>
        <header>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-indigo-400/80">Sleep rescue</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-100">Awake in the middle of the night</h1>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500">The job is to reduce struggle and rebuild the bed = sleep association, not to force sleep.</p>
        </header>
        <div className="flex flex-col gap-2">
          {AWAKE_AT_NIGHT_STEPS.map((step, index) => (
            <Card key={step.id} className="border-indigo-950/60 bg-indigo-950/10">
              <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-300">Step {index + 1}</p>
              <p className="mt-1 text-sm font-medium text-zinc-200">{step.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{step.detail}</p>
            </Card>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/execute/calm-breathing"><Button size="sm">Start calm breathing</Button></Link>
          <Link href="/execute/meditation?minutes=10"><Button size="sm" variant="secondary">10-minute meditation</Button></Link>
        </div>
        <p className="text-[11px] leading-relaxed text-zinc-600">
          If this is happening often or causing significant daytime impairment, the higher-value intervention is CBT-I or other professional sleep care, not adding more hacks.
        </p>
      </div>
    );
  }

  const groups = ["morning", "day", "evening", "bedroom"] as const;
  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <Link href="/execute" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200">
        <ArrowLeft className="h-3.5 w-3.5" /> Routines
      </Link>
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-indigo-400/80">Foundational sleep</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-100">Sleep Protocol</h1>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">
          A few anchors across the day. No sleep score, perfect-bedtime requirement, or supplement stack.
        </p>
      </header>

      {groups.map((period) => (
        <section key={period}>
          <div className="mb-2 flex items-center gap-2">
            {period === "evening" || period === "bedroom" ? <Moon className="h-3.5 w-3.5 text-indigo-400" /> : <Sparkles className="h-3.5 w-3.5 text-indigo-400" />}
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{period}</p>
          </div>
          <div className="flex flex-col gap-2">
            {SLEEP_ANCHORS.filter((item) => item.period === period).map((item) => (
              <Card key={item.id} className="border-zinc-800 bg-zinc-950/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">{item.detail}</p>
                  </div>
                  {item.priority === "optional" && <span className="shrink-0 text-[10px] text-zinc-600">optional</span>}
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Link href="/execute/evening-reset"><Button className="w-full">Start evening reset</Button></Link>
        <Link href="/execute/awake-at-night"><Button className="w-full" variant="secondary">I&apos;m awake now</Button></Link>
      </div>

      <p className="text-[11px] leading-relaxed text-zinc-600">
        Sleep medicine gives more weight to a consistent schedule, a cool/dark environment, and stimulus control than to elaborate optimization routines.
      </p>
    </div>
  );
}
