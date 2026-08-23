"use client";

import { useMemo, useState } from "react";
import { Shuffle } from "lucide-react";
import {
  ADVICE_CATEGORY_LABELS,
  ADVICE_ITEMS,
  adviceForCategory,
  randomAdvice,
  type AdviceCategory,
  type AdviceItem,
} from "@/domain/advice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const CATEGORIES = Object.keys(ADVICE_CATEGORY_LABELS) as AdviceCategory[];

function firstAdvice(category?: AdviceCategory | null): AdviceItem {
  return category ? adviceForCategory(category)[0] ?? ADVICE_ITEMS[0] : ADVICE_ITEMS[0];
}

export function AdviceView({ initialCategory }: { initialCategory?: AdviceCategory | null }) {
  const [category, setCategory] = useState<AdviceCategory | "all">(initialCategory ?? "all");
  const [advice, setAdvice] = useState<AdviceItem>(() => firstAdvice(initialCategory));

  const count = useMemo(
    () => (category === "all" ? ADVICE_ITEMS.length : ADVICE_ITEMS.filter((item) => item.category === category).length),
    [category]
  );

  function pick(nextCategory = category) {
    setAdvice(randomAdvice(nextCategory === "all" ? undefined : nextCategory));
  }

  function chooseCategory(next: AdviceCategory | "all") {
    setCategory(next);
    setAdvice(firstAdvice(next === "all" ? null : next));
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100">Advice</h1>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">Short reminders drawn from the operating principles already used in Year Mission. One useful idea, then back to action.</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => chooseCategory("all")} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${category === "all" ? "border-zinc-500 bg-zinc-100 text-zinc-950" : "border-zinc-800 text-zinc-500"}`}>All</button>
        {CATEGORIES.map((item) => <button key={item} onClick={() => chooseCategory(item)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${category === item ? "border-zinc-500 bg-zinc-100 text-zinc-950" : "border-zinc-800 text-zinc-500"}`}>{ADVICE_CATEGORY_LABELS[item]}</button>)}
      </div>

      <Card className="border-sky-900/50 bg-sky-950/10">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-sky-400/70">{ADVICE_CATEGORY_LABELS[advice.category]}</p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-100">{advice.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{advice.body}</p>
        {advice.action && <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-3 text-sm leading-relaxed text-zinc-300"><span className="font-medium text-zinc-100">Try this:</span> {advice.action}</p>}
        <Button className="mt-4 w-full" variant="secondary" onClick={() => pick()}><Shuffle className="mr-1.5 h-4 w-4" /> Give me another</Button>
      </Card>

      <p className="text-center text-[11px] text-zinc-700">{count} cues in this category. Advice is intentionally brief and non-scored.</p>
    </div>
  );
}
