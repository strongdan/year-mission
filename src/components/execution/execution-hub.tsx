"use client";

import Link from "next/link";
import { Dumbbell, Headphones, Moon, Play, Sparkles, TimerReset } from "lucide-react";
import { Card } from "@/components/ui/card";

const ITEMS = [
  { href: "/execute/strength-a", title: "Strength A", detail: "~32 min · full body", icon: Dumbbell },
  { href: "/execute/strength-b", title: "Strength B", detail: "~31 min · full body", icon: Dumbbell },
  { href: "/execute/strength-quick", title: "Quick Strength", detail: "~15 min · minimum viable lift", icon: TimerReset },
  { href: "/execute/evening-mobility", title: "Evening Mobility", detail: "8 min · guided stretches", icon: Play },
  { href: "/execute/meditation?minutes=5", title: "Meditation", detail: "5 / 10 / 20 min timer", icon: Sparkles },
  { href: "/execute/hypnosis", title: "Hypnosis", detail: "MP3 / MP4 / Audiobookshelf", icon: Headphones },
  { href: "/execute/evening-reset", title: "Evening Reset", detail: "Stretch → meditate → hypnosis", icon: Moon },
];

export function ExecutionHub() {
  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100">Routines</h1>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">Pick the runnable version. Timers, steps, substitutions, and playback are built in.</p>
      </header>
      <div className="flex flex-col gap-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="flex items-center gap-3 transition-colors hover:border-zinc-700">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900"><Icon className="h-5 w-5 text-zinc-400" /></div>
                <div className="min-w-0 flex-1"><p className="text-sm font-medium text-zinc-200">{item.title}</p><p className="mt-0.5 text-xs text-zinc-600">{item.detail}</p></div>
                <span className="text-xs text-zinc-500">Start</span>
              </Card>
            </Link>
          );
        })}
      </div>
      <Link href="/settings" className="text-center text-xs text-zinc-600 hover:text-zinc-300">Equipment, external apps, and hypnosis media are configured in Settings.</Link>
    </div>
  );
}
