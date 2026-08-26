"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getGoogleSyncStatusAction,
  connectGoogleTasksAction,
  syncGoogleTasksAction,
  disconnectGoogleTasksAction,
} from "@/app/actions";
import {
  addGoogleTaskAction,
  getGoogleTaskHubAction,
  removeGoogleTaskAction,
} from "@/app/google-task-actions";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Plus, RefreshCw, Search, Trash2 } from "lucide-react";

type HubData = NonNullable<Awaited<ReturnType<typeof getGoogleTaskHubAction>>["data"]>;
type HubTask = HubData["tasks"][number];

interface Status {
  configured: boolean;
  connected: boolean;
  email: string | null;
  lastSyncedAt: string | null;
}

const HIDDEN_KEY = "year-mission:hidden-google-tasks:v1";

function taskKey(task: Pick<HubTask, "tasklistId" | "id">) {
  return `${task.tasklistId}:${task.id}`;
}

function loadHidden(): Set<string> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HIDDEN_KEY) ?? "[]") as unknown;
    return new Set(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : []);
  } catch {
    return new Set();
  }
}

function saveHidden(hidden: Set<string>) {
  try {
    window.localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden]));
  } catch {
    // Hiding is a display preference; failure should not block task management.
  }
}

function formatDue(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function GoogleTasksCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [hub, setHub] = useState<HubData | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedList, setSelectedList] = useState("");
  const [newTask, setNewTask] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [loadingHub, setLoadingHub] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    const res = await getGoogleSyncStatusAction();
    if (res.ok && res.data) setStatus(res.data);
  }

  async function loadHub() {
    setLoadingHub(true);
    setError(null);
    const res = await getGoogleTaskHubAction();
    setLoadingHub(false);
    if (!res.ok || !res.data) {
      setError(res.error ?? "Google Tasks could not be loaded.");
      return;
    }
    setHub(res.data);
    setSelectedList((current) => current || res.data.lists[0]?.id || "");
  }

  useEffect(() => {
    setHidden(loadHidden());
    let cancelled = false;
    (async () => {
      const res = await getGoogleSyncStatusAction();
      if (cancelled || !res.ok || !res.data) return;
      setStatus(res.data);
      if (res.data.connected) {
        const hubRes = await getGoogleTaskHubAction();
        if (cancelled) return;
        if (hubRes.ok && hubRes.data) {
          setHub(hubRes.data);
          setSelectedList(hubRes.data.lists[0]?.id ?? "");
        } else {
          setError(hubRes.error ?? "Google Tasks could not be loaded.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleTasks = useMemo(() => {
    if (!hub) return [];
    const needle = query.trim().toLowerCase();
    return hub.tasks.filter((task) => {
      const isHidden = hidden.has(taskKey(task));
      if (isHidden !== showHidden) return false;
      if (!showCompleted && task.status === "completed") return false;
      if (!needle) return true;
      return `${task.title} ${task.tasklistTitle} ${task.notes ?? ""}`.toLowerCase().includes(needle);
    });
  }, [hub, hidden, query, showCompleted, showHidden]);

  const hiddenCount = hub?.tasks.filter((task) => hidden.has(taskKey(task))).length ?? 0;
  const activeCount = hub?.tasks.filter((task) => task.status !== "completed").length ?? 0;

  async function connect() {
    setError(null);
    const res = await connectGoogleTasksAction();
    if (res.ok && res.data?.url) window.location.href = res.data.url;
    else setError(res.error ?? "Failed to connect.");
  }

  async function sync() {
    if (syncing) return;
    setSyncing(true);
    setMessage(null);
    setError(null);
    const res = await syncGoogleTasksAction();
    if (res.ok && res.data?.summary) {
      const s = res.data.summary;
      setMessage(`${s.pulled} pulled · ${s.pushed} pushed · ${s.updated} updated${s.conflicts ? ` · ${s.conflicts} conflicts` : ""}`);
      await loadHub();
    } else {
      setError(res.error ?? "Sync failed.");
    }
    setSyncing(false);
  }

  function toggleHidden(task: HubTask) {
    const next = new Set(hidden);
    const key = taskKey(task);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setHidden(next);
    saveHidden(next);
  }

  async function addTask() {
    const title = newTask.trim();
    if (!title || !selectedList || adding) return;
    setAdding(true);
    setError(null);
    const res = await addGoogleTaskAction({ tasklistId: selectedList, title });
    setAdding(false);
    if (!res.ok) {
      setError(res.error ?? "Google task could not be added.");
      return;
    }
    setNewTask("");
    setMessage("Google task added.");
    await loadHub();
  }

  async function removeTask(task: HubTask) {
    if (!window.confirm(`Delete “${task.title}” from Google Tasks?`)) return;
    const key = taskKey(task);
    setRemoving(key);
    setError(null);
    const res = await removeGoogleTaskAction({ tasklistId: task.tasklistId, taskId: task.id });
    setRemoving(null);
    if (!res.ok) {
      setError(res.error ?? "Google task could not be removed.");
      return;
    }
    const next = new Set(hidden);
    next.delete(key);
    setHidden(next);
    saveHidden(next);
    setHub((current) => current ? { ...current, tasks: current.tasks.filter((item) => taskKey(item) !== key) } : current);
    setMessage("Removed from Google Tasks.");
  }

  if (!status?.configured) {
    return (
      <Card>
        <CardHeader title="Google Tasks" subtitle="All of your Google task lists in one place." />
        <p className="text-xs text-zinc-500">Not configured on the server.</p>
      </Card>
    );
  }

  if (!status.connected) {
    return (
      <Card>
        <CardHeader title="Google Tasks" subtitle="See and manage every Google task list inside Year Mission." />
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-400">Connect Google to view all lists, add tasks, hide clutter in this app, or delete tasks from Google.</p>
          <div><Button size="sm" onClick={connect}>Connect Google</Button></div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Google Tasks"
        subtitle={status.email ? `${activeCount} open across ${hub?.lists.length ?? 0} lists · ${status.email}` : "All Google lists"}
        right={
          <button onClick={loadHub} disabled={loadingHub} aria-label="Refresh Google tasks" className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40">
            <RefreshCw className={`h-4 w-4 ${loadingHub ? "animate-spin" : ""}`} />
          </button>
        }
      />

      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            value={newTask}
            onChange={(event) => setNewTask(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && void addTask()}
            placeholder="Add Google task…"
            className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />
          <select
            value={selectedList}
            onChange={(event) => setSelectedList(event.target.value)}
            aria-label="Google task list"
            className="max-w-[42%] rounded-xl border border-zinc-800 bg-zinc-950 px-2 py-2 text-xs text-zinc-300 outline-none"
          >
            {(hub?.lists ?? []).map((list) => <option key={list.id} value={list.id}>{list.title}</option>)}
          </select>
          <Button size="sm" onClick={addTask} disabled={adding || !newTask.trim() || !selectedList}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2">
          <Search className="h-3.5 w-3.5 text-zinc-600" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search all Google tasks"
            className="min-w-0 flex-1 bg-transparent text-xs text-zinc-300 outline-none placeholder:text-zinc-600"
          />
        </div>

        <div className="flex flex-wrap gap-2 text-[11px]">
          <button onClick={() => setShowCompleted((value) => !value)} className={`rounded-full border px-2.5 py-1 ${showCompleted ? "border-zinc-600 text-zinc-200" : "border-zinc-800 text-zinc-500"}`}>
            {showCompleted ? "Hide completed" : "Show completed"}
          </button>
          <button onClick={() => setShowHidden((value) => !value)} className={`rounded-full border px-2.5 py-1 ${showHidden ? "border-zinc-600 text-zinc-200" : "border-zinc-800 text-zinc-500"}`}>
            {showHidden ? "Back to visible" : `Hidden${hiddenCount ? ` (${hiddenCount})` : ""}`}
          </button>
        </div>

        {message && <p className="text-xs text-emerald-400">{message}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}

        {loadingHub && !hub ? (
          <p className="text-sm text-zinc-500">Loading Google Tasks…</p>
        ) : visibleTasks.length > 0 ? (
          <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {visibleTasks.map((task) => {
              const key = taskKey(task);
              const due = formatDue(task.due);
              const isDone = task.status === "completed";
              return (
                <div key={key} className="rounded-xl border border-zinc-800 bg-zinc-950/35 px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm leading-snug ${isDone ? "text-zinc-600 line-through" : "text-zinc-200"}`}>{task.title}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-zinc-600">
                        <span>{task.tasklistTitle}</span>
                        {due && <span>Due {due}</span>}
                        {isDone && <span>Completed</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button onClick={() => toggleHidden(task)} title={showHidden ? "Show in Year Mission" : "Hide in Year Mission"} className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-200">
                        {showHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => void removeTask(task)} disabled={removing === key} title="Delete from Google Tasks" className="rounded-lg p-1.5 text-zinc-600 hover:bg-red-950/50 hover:text-red-300 disabled:opacity-40">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">{showHidden ? "No hidden Google tasks." : "No matching Google tasks."}</p>
        )}

        <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-3">
          <Button size="sm" variant="secondary" onClick={sync} disabled={syncing}>
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync Year Mission list"}
          </Button>
          <Button size="sm" variant="ghost" onClick={async () => { await disconnectGoogleTasksAction(); await loadStatus(); setHub(null); }}>
            Disconnect
          </Button>
        </div>

        <p className="text-[10px] leading-relaxed text-zinc-600">
          Hide only affects this device&apos;s Year Mission view. Delete removes the task from Google. Existing two-way Year Mission sync remains limited to the dedicated Year Mission Google list.
        </p>
      </div>
    </Card>
  );
}
