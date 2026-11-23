"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getConversationConfidenceAction } from "@/app/conversation-confidence-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CONFIDENCE_ADJUSTMENTS,
  CONFIDENCE_ANCHOR,
  CONFIDENCE_FIRST_WEEK,
  CONFIDENCE_HUMOR_EXAMPLES,
  CONFIDENCE_HYPNOSIS_TRIAL,
  CONFIDENCE_METHODS,
  CONFIDENCE_PRACTICE_TOOLS,
  CONFIDENCE_RECOVERY_STEPS,
  CONFIDENCE_RESTART_PLAN,
  CONFIDENCE_REVIEW_PROMPTS,
  CONFIDENCE_ROADMAP,
  CONFIDENCE_SOURCES,
  CONFIDENCE_WEEKLY_RHYTHM,
} from "@/domain/confidence-roadmap";
import type { StoredConversationPath } from "@/domain/conversation-confidence-storage";

type SavedPath = Pick<StoredConversationPath, "active" | "month" | "status">;
type PathState =
  | { state: "loading" }
  | { state: "ready"; path: SavedPath }
  | { state: "unavailable" };

const linkClass = "inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-zinc-200 underline decoration-violet-500/40 underline-offset-4 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500";
const headingClass = "text-base font-semibold text-zinc-100";
const sectionClass = "scroll-mt-4 space-y-3";
const summaryClass = "min-h-11 cursor-pointer rounded-lg py-2 text-sm font-medium text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500";

function PracticeList({ items }: { items: readonly string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-300">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

function RecoveryGuide() {
  return (
    <section id="recover" aria-labelledby="recovery-heading" className={sectionClass}>
      <Card className="border-violet-900/60 bg-violet-950/15">
        <h2 id="recovery-heading" className={headingClass}>After a mistake</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">You can return while you still feel embarrassed. Take whichever step helps; there is no required journal or recovery deadline.</p>
        <blockquote className="mt-4 border-l-2 border-violet-400 pl-3 text-base leading-relaxed text-zinc-100">{CONFIDENCE_ANCHOR}</blockquote>
        <ol className="mt-5 space-y-4">
          {CONFIDENCE_RECOVERY_STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-900/40 text-xs text-zinc-100">{index + 1}</span>
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-zinc-100">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-300">{step.prompt}</p>
                <p className="mt-2 text-sm italic leading-relaxed text-zinc-200">{step.example}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link href="/" className={`${linkClass} mt-4`}>Return to Today <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
        <details className="mt-2 border-t border-violet-900/40 pt-2">
          <summary className={summaryClass}>Make room for gentle humor</summary>
          <p className="mb-3 text-sm leading-relaxed text-zinc-300">A neutral “Oops” is enough. Humor can be affectionate when it feels natural; you never have to make a joke or feel better on command. Address any harm first.</p>
          <PracticeList items={CONFIDENCE_HUMOR_EXAMPLES} />
        </details>
      </Card>
    </section>
  );
}

function YearRoadmap({ currentMonth }: { currentMonth: number | null }) {
  return (
    <section id="roadmap" aria-labelledby="roadmap-heading" className={sectionClass}>
      <h2 id="roadmap-heading" className={headingClass}>Your twelve-month roadmap</h2>
      <p className="text-sm leading-relaxed text-zinc-400">Recovery practice begins in the first week and continues throughout the year. These are flexible themes. Repeat, pause, or move forward when useful; elapsed time never moves you ahead.</p>
      <div className="space-y-2">
        {CONFIDENCE_ROADMAP.map((month) => {
          const isCurrent = month.month === currentMonth;
          return (
            <details
              key={month.month}
              open={isCurrent || undefined}
              className={`rounded-xl border px-4 py-1 ${isCurrent ? "border-violet-700/60 bg-violet-950/15" : "border-zinc-800 bg-zinc-900/30"}`}
            >
              <summary className={summaryClass} aria-current={isCurrent ? "step" : undefined}>
                <h3 className="inline text-sm font-medium">
                  <span className="mr-2 text-zinc-400">{month.month}.</span>{month.title}
                  {isCurrent && <span className="ml-2 text-xs font-normal text-zinc-300">Your current month</span>}
                </h3>
              </summary>
              <div className="space-y-4 pb-4 pt-2">
                <p className="text-sm leading-relaxed text-zinc-300">{month.focus}</p>
                <PracticeList items={month.practices} />
                <div className="rounded-xl bg-zinc-950/40 p-3">
                  <h4 className="mb-2 text-xs font-semibold text-zinc-200">Two possible actions this week</h4>
                  <PracticeList items={month.weeklyActions} />
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300"><span className="font-medium text-zinc-100">One cue: </span>{month.skill}</p>
                </div>
                <p className="text-sm leading-relaxed text-zinc-300"><span className="font-medium text-zinc-100">Progress you might notice: </span>{month.milestone}</p>
                <p className="text-sm leading-relaxed text-zinc-400"><span className="font-medium text-zinc-300">Optional reflection: </span>{month.reflection}</p>
              </div>
            </details>
          );
        })}
      </div>
      <Link href="/#confidence-focus" className={linkClass}>Manage this focus on Today</Link>
    </section>
  );
}

function HypnosisGuide() {
  const trial = CONFIDENCE_HYPNOSIS_TRIAL;
  return (
    <section id="hypnosis" aria-labelledby="hypnosis-heading" className={sectionClass}>
      <h2 id="hypnosis-heading" className={headingClass}>Optional hypnosis trial</h2>
      <p className="text-sm leading-relaxed text-zinc-300">{trial.summary}</p>
      <Card>
        <details>
          <summary className={summaryClass}>How to try it and decide whether it helps</summary>
          <div className="space-y-4 pt-2">
            <p className="text-sm leading-relaxed text-zinc-300">{trial.duration}</p>
            <p className="text-sm leading-relaxed text-zinc-300">{trial.practice}</p>
            <h3 className="text-sm font-semibold text-zinc-100">Choose a concrete target</h3>
            <PracticeList items={trial.targets} />
            <h3 className="text-sm font-semibold text-zinc-100">Review the effect in everyday life</h3>
            <PracticeList items={trial.reviews} />
            <h3 className="text-sm font-semibold text-zinc-100">Ask a qualified practitioner</h3>
            <PracticeList items={trial.practitionerQuestions} />
            <h3 className="text-sm font-semibold text-zinc-100">Keep the trial useful</h3>
            <PracticeList items={trial.safeguards} />
          </div>
        </details>
      </Card>
    </section>
  );
}

export function ConfidencePlanView() {
  const [pathState, setPathState] = useState<PathState>({ state: "loading" });

  useEffect(() => {
    let active = true;
    void getConversationConfidenceAction().then((result) => {
      if (!active) return;
      setPathState(result.ok ? { state: "ready", path: result.data.path } : { state: "unavailable" });
    }).catch(() => {
      if (active) setPathState({ state: "unavailable" });
    });
    return () => { active = false; };
  }, []);

  async function retryPath() {
    setPathState({ state: "loading" });
    try {
      const result = await getConversationConfidenceAction();
      setPathState(result.ok ? { state: "ready", path: result.data.path } : { state: "unavailable" });
    } catch {
      setPathState({ state: "unavailable" });
    }
  }

  const savedPath = pathState.state === "ready" ? pathState.path : null;
  const currentMonth = savedPath?.active ? savedPath.month : null;

  return (
    <main className="space-y-6 px-4 py-4">
      <header>
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className={linkClass}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Today</Link>
          <Link href="/progress" className={linkClass}>Progress</Link>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-100">Self-Trust &amp; Confidence</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">A year of recovering from mistakes, connecting with people, and feeling more comfortable being yourself.</p>
        <div className="mt-3 text-xs leading-relaxed text-zinc-400" role="status" aria-live="polite">
          {pathState.state === "loading" && <p>Loading your saved focus… The full guide is ready below.</p>}
          {pathState.state === "unavailable" && (
            <div>
              <p>Your saved focus is unavailable right now. You can still use the full guide.</p>
              <Button variant="ghost" className="mt-1 min-h-11" onClick={() => void retryPath()}>Try loading your focus again</Button>
            </div>
          )}
          {savedPath && (
            <p>{savedPath.active
              ? `Month ${savedPath.month} of 12${savedPath.status === "paused" ? " · Paused" : " · At your pace"}.`
              : savedPath.status === "stopped"
                ? "Your focus is stopped. The guide remains here whenever it is useful."
                : "Explore the guide before choosing this optional focus on Today."}</p>
          )}
        </div>
      </header>

      <nav aria-label="Confidence guide sections" className="flex flex-wrap gap-x-1 gap-y-1 rounded-xl border border-zinc-800 p-2">
        <a className={linkClass} href="#recover">After a mistake</a>
        <a className={linkClass} href="#roadmap">12 months</a>
        <a className={linkClass} href="#hypnosis">Hypnosis</a>
        <a className={linkClass} href="#review">Review</a>
        <a className={linkClass} href="#sources">Sources</a>
      </nav>

      <RecoveryGuide />

      <section aria-labelledby="weekly-heading" className={sectionClass}>
        <h2 id="weekly-heading" className={headingClass}>A small weekly rhythm</h2>
        <Card>
          <dl className="space-y-4">
            {CONFIDENCE_WEEKLY_RHYTHM.map((item) => (
              <div key={item.when}>
                <dt className="text-sm font-medium text-zinc-100">{item.when}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-zinc-300">{item.action}</dd>
              </div>
            ))}
          </dl>
          <details className="mt-4 border-t border-zinc-800 pt-2">
            <summary className={summaryClass}>Your first week</summary>
            <div className="pt-2"><PracticeList items={CONFIDENCE_FIRST_WEEK} /></div>
          </details>
        </Card>
      </section>

      <YearRoadmap currentMonth={currentMonth} />

      <section aria-labelledby="tools-heading" className={sectionClass}>
        <h2 id="tools-heading" className={headingClass}>Practices to return to</h2>
        <Card>
          {CONFIDENCE_PRACTICE_TOOLS.map((tool) => (
            <details key={tool.title} className="border-b border-zinc-800 py-1 last:border-0">
              <summary className={summaryClass}>{tool.title}</summary>
              <div className="space-y-3 pb-3 pt-2">
                <PracticeList items={tool.steps} />
                <p className="text-sm italic leading-relaxed text-zinc-200">{tool.example}</p>
              </div>
            </details>
          ))}
        </Card>
      </section>

      <section aria-labelledby="methods-heading" className={sectionClass}>
        <h2 id="methods-heading" className={headingClass}>What the approaches can help with</h2>
        <p className="text-sm leading-relaxed text-zinc-400">The methods have different levels of evidence. This exact twelve-month sequence is a practical plan, and the pace can change with your needs.</p>
        <Card>
          {CONFIDENCE_METHODS.map((method) => (
            <details key={method.name} className="border-b border-zinc-800 py-1 last:border-0">
              <summary className={summaryClass}>{method.name}</summary>
              <div className="space-y-3 pb-3 pt-2">
                <p className="text-sm leading-relaxed text-zinc-300">{method.role}</p>
                <p className="text-sm leading-relaxed text-zinc-400">{method.evidence}</p>
                <ul>
                  {method.sourceIds.map((id) => {
                    const source = CONFIDENCE_SOURCES.find((item) => item.id === id);
                    return source ? <li key={id}><a href={`#source-${id}`} className={`${linkClass} text-xs`}>{source.title}</a></li> : null;
                  })}
                </ul>
              </div>
            </details>
          ))}
        </Card>
      </section>

      <HypnosisGuide />

      <section id="review" aria-labelledby="review-heading" className={sectionClass}>
        <h2 id="review-heading" className={headingClass}>Notice change without grading yourself</h2>
        <p className="text-sm leading-relaxed text-zinc-400">Once a month, consider a few real examples. There is no confidence score or target for how fast a feeling must pass.</p>
        <Card>
          <PracticeList items={CONFIDENCE_REVIEW_PROMPTS} />
          <Link href="/progress" className={`${linkClass} mt-3`}>View your confidence evidence in Progress</Link>
          <details className="mt-2 border-t border-zinc-800 pt-2">
            <summary className={summaryClass}>When to adjust the plan</summary>
            <div className="pt-2"><PracticeList items={CONFIDENCE_ADJUSTMENTS} /></div>
          </details>
          <details className="mt-2 border-t border-zinc-800 pt-2">
            <summary className={summaryClass}>After a difficult week</summary>
            <p className="pb-2 pt-2 text-sm leading-relaxed text-zinc-300">{CONFIDENCE_RESTART_PLAN}</p>
          </details>
        </Card>
      </section>

      <section id="sources" aria-labelledby="sources-heading" className={sectionClass}>
        <h2 id="sources-heading" className={headingClass}>Evidence and practical resources</h2>
        <p className="text-sm leading-relaxed text-zinc-400">Source pages open separately. Reading or listening is optional; everyday participation remains the practice.</p>
        <ul className="space-y-2">
          {CONFIDENCE_SOURCES.map((source) => (
            <li key={source.id} id={`source-${source.id}`} className="scroll-mt-4 rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-1">
              <a href={source.url} target="_blank" rel="noopener noreferrer" className={`${linkClass} w-full break-words`}>
                <span className="min-w-0 flex-1">{source.title}</span>
                <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <Link href="/" className={linkClass}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Return to Today</Link>
    </main>
  );
}
