"use client";

import { useEffect, useState } from "react";
import {
  createTaskAction,
  promoteToWeekAction,
  promoteToTodayAction,
  completeTaskAction,
  deferTaskAction,
  setWeeklyWinAction,
  getTasksAction,
} from "@/app/actions";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { DeferralReason } from "@/domain/constants";
import { taskWeight, sizeFromMinutes } from "@/domain/task-weight";
import { GoogleTasksCard } from "./google-tasks-card";

const DEFERRAL_REASONS: { value: DeferralReason; label: string }[] = [
  { value: "too_big", label: "Too big" },
  { value: "dont_know_how", label: "Don't know how" },
  { value: "no_energy", label: "No energy" },
  { value: "not_important", label: "Not important" },
  { value: "blocked", label: "Blocked" },
  { value: "just_avoiding", label: "Just avoiding it" },
];

interface Task {
  id: string;
  title: string;
  status: string;
  domain: { slug: string; title: string } | null | undefined;
  estimated_minutes: number | null;
  courage_task: boolean;
  defer_count: number;
  weekly_win: boolean;
  impact: string;
}

export function TasksView() {
  const [capture, setCapture] = useState("");
  const [parseWithAi, setParseWithAi] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deferring, setDeferring] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<{
    inbox: Task[];
    week: Task[];
    today: Task[];
    backlog: Task[];
    completed: Task[];
  } | null>(null);

  async function load() {
    const res = await getTasksAction();
    if (res.ok && res.data) {
      setSections({
        inbox: res.data.inbox as Task[],
        week: res.data.week as Task[],
        today: res.data.today as Task[],
        backlog: res.data.backlog as Task[],
        completed: res.data.completed as Task[],
      });
    }
  }

  useEffect(() => {
    let cancelled = false;
    getTasksAction().then((res) => {
      if (cancelled) return;
      if (res.ok && res.data) {
        setSections({
          inbox: res.data.inbox as Task[],
          week: res.data.week as Task[],
          today: res.data.today as Task[],
          backlog: res.data.backlog as Task[],
          completed: res.data.completed as Task[],
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit() {
    if (!capture.trim()) return;
    setAdding(true);
    setError(null);
    const res = await createTaskAction({ title: capture.trim(), parseWithAi });
    if (!res.ok) setError(res.error ?? "Failed to add.");
    else setCapture("");
    setAdding(false);
    load();
  }

  function TaskRow({ task, section }: { task: Task; section: "inbox" | "week" | "today" | "backlog" | "completed" }) {
    const weight = taskWeight({ impact: task.impact as "low" | "medium" | "high", size: sizeFromMinutes(task.estimated_minutes), courage: task.courage_task });
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl bg-zinc-800/50 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm ${task.status === "completed" ? "text-zinc-600 line-through" : "text-zinc-200"}`}>
            {task.weekly_win && <span className="mr-1.5 text-amber-400">★</span>}
            {task.title}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500">
            {task.domain && <span className="capitalize">{task.domain.slug}</span>}
            {task.estimated_minutes && <span>{task.estimated_minutes}m</span>}
            {task.courage_task && <span className="text-amber-400">Uncomfortable but important</span>}
            {task.defer_count > 0 && <span className="text-orange-400">Deferred ×{task.defer_count}</span>}
            <span className="text-zinc-600">w{weight}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {section === "inbox" && (
            <Button size="sm" variant="secondary" onClick={() => promoteToWeekAction(task.id).then(load)}>
              → Week
            </Button>
          )}
          {section === "week" && (
            <Button size="sm" variant="secondary" onClick={() => promoteToTodayAction(task.id).then(load)}>
              → Today
            </Button>
          )}
          {section === "today" && (
            <>
              <Button size="sm" variant="secondary" onClick={() => completeTaskAction(task.id).then(load)}>
                Done
              </Button>
              <button onClick={() => setDeferring(deferring === task.id ? null : task.id)} className="rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-800">
                Defer
              </button>
            </>
          )}
          {section === "backlog" && (
            <Button size="sm" variant="secondary" onClick={() => promoteToWeekAction(task.id).then(load)}>
              → Week
            </Button>
          )}
          {section === "week" && (
            <button
              onClick={() => setWeeklyWinAction(task.id)}
              title="Set as Weekly Win"
              className="rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-amber-400"
            >
              ★
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header>
        <h1 className="text-xl font-semibold">Tasks</h1>
        <p className="text-xs text-zinc-500">Commitments, not intentions.</p>
      </header>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={capture}
            onChange={(e) => setCapture(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Add task…"
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-zinc-500"
          />
          <Button onClick={submit} disabled={adding || !capture.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <input type="checkbox" checked={parseWithAi} onChange={(e) => setParseWithAi(e.target.checked)} />
          Parse with AI (domain, date, effort, courage)
        </label>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <GoogleTasksCard />

      {deferring && (
        <Card className="border-zinc-700">
          <CardHeader title="What's getting in the way?" subtitle="This helps the system learn how to help you." />
          <div className="flex flex-wrap gap-2">
            {DEFERRAL_REASONS.map((r) => (
              <Button
                key={r.value}
                size="sm"
                variant="secondary"
                onClick={() => {
                  deferTaskAction(deferring, r.value).then(() => {
                    setDeferring(null);
                    load();
                  });
                }}
              >
                {r.label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setDeferring(null)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {sections && (
        <>
          {sections.today.length > 0 && (
            <Card>
              <CardHeader title="Today" subtitle="Max 5 intentional tasks" />
              <div className="flex flex-col gap-2">{sections.today.map((t) => <TaskRow key={t.id} task={t} section="today" />)}</div>
            </Card>
          )}

          <Card>
            <CardHeader title="This Week" subtitle="Max 12 meaningful tasks" />
            {sections.week.length > 0 ? (
              <div className="flex flex-col gap-2">{sections.week.map((t) => <TaskRow key={t.id} task={t} section="week" />)}</div>
            ) : (
              <p className="text-sm text-zinc-500">Pick the handful of tasks that matter this week.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Inbox" subtitle="Uncommitted. Nothing here is a promise." />
            {sections.inbox.length > 0 ? (
              <div className="flex flex-col gap-2">{sections.inbox.map((t) => <TaskRow key={t.id} task={t} section="inbox" />)}</div>
            ) : (
              <p className="text-sm text-zinc-500">Empty. Capture ideas and tasks here.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Someday" subtitle="Parked, not planned" />
            {sections.backlog.length > 0 ? (
              <div className="flex flex-col gap-2">{sections.backlog.map((t) => <TaskRow key={t.id} task={t} section="backlog" />)}</div>
            ) : (
              <p className="text-sm text-zinc-500">Nothing parked.</p>
            )}
          </Card>

          {sections.completed.length > 0 && (
            <Card>
              <CardHeader title="Completed" />
              <div className="flex flex-col gap-2">{sections.completed.map((t) => <TaskRow key={t.id} task={t} section="completed" />)}</div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}