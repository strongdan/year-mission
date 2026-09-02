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

interface HubTask {
  id: string;
  title: string;
  status: string;
  notes?: string | null;
  due?: string | null;
  completed?: string | null;
  tasklistId: string;
  tasklistTitle: string;
}

interface HubData {
  lists: { id: string; title: string }[];
  tasks: HubTask[];
}

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
  if (typeof window === "undefined") return new Set();
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
  const [hidden, setHidden] = useState<Set<string>>(() => loadHidden());
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

  async function loadStatus(): Promise<Status | null> {
    const res = await getGoogleSyncStatusAction();
    if (res.ok && res.data) {
      setStatus(res.data);
      if (!res.data.connected) setHub(null);
      return res.data;
    }
    return null;
  }

  async function handleGoogleFailure(message: string) {
    setError(message);
    await loadStatus();
  }

  async function loadHub() {
    setLoadingHub(true);
    setError(null);
    const res = await getGoogleTaskHubAction();
    setLoadingHub(false);
    if (!res.ok || !res.data) {
      await handleGoogleFailure(res.error ?? "Google Tasks could not be loaded.");
      return;
    }
    setHub(res.data as HubData);
    setSelectedList((current) => current || res.data.lists[0]?.id || "");
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getGoogleSyncStatusAction();
      if (cancelled || !res.ok || !res.data) return;
      setStatus(res.data);
      if (res.data.connected) {
        const hubRes = await getGoogleTaskHubAction();
        if (cancelled) return;
        if (hubRes.ok && hubRes.data) {
          setHub(hubRes.data as HubData);
          setSelectedList(hubRes.data.lists[0]?.id ?? "");
        } else {
          setError(hubRes.error ?? "Google Tasks could not be loaded.");
          const statusRes = await getGoogleSyncStatusAction();
          if (cancelled || !statusRes.ok || !statusRes.data) return;
          setStatus(statusRes.data);
          if (!statusRes.data.connected) setHub(null);
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
      if (needle && !`${task.title} ${task.notes ?? ""} ${task.tasklistTitle}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [hub, hidden, showHidden, showCompleted, query]);

  async function connect() {
    setError(null);
    const result = await connectGoogleTasksAction();
    if (result.ok && result.data?.url) window.location.href = result.data.url;
    else setError(result.error ?? "Could not connect Google Tasks.");
  }

  async function sync() {
    setSyncing(true);
    setError(null);
    setMessage(null);
    const result = await syncGoogleTasksAction();
    if (result.ok) {
      setMessage("Google Tasks synced.");
      await Promise.all([loadStatus(), loadHub()]);
    } else {
      await handleGoogleFailure(result.error ?? "Google Tasks sync failed.");
    }
    setSyncing(false);
  }

  async function disconnect() {
    setError(null);
    const result = await disconnectGoogleTasksAction();
    if (result.ok) {
      setStatus((current) => current ? { ...current, connected: false, email: null } : current);
      setHub(null);
      setMessage("Google Tasks disconnected.");
    } else {
      setError(result.error ?? "Could not disconnect Google Tasks.");
    }
  }

  async function addTask() {
    if (!selectedList || !newTask.trim() || adding) return;
    setAdding(true);
    setError(null);
    setMessage(null);
    const result = await addGoogleTaskAction({ tasklistId: selectedList, title: newTask.trim() });
    if (result.ok) {
      setNewTask("");
      setMessage("Added to Google Tasks.");
      await loadHub();
    } else {
      await handleGoogleFailure(result.error ?? "Could not add Google Task.");
    }
    setAdding(false);
  }

  async function removeTask(task: HubTask) {
    if (removing) return;
    setRemoving(taskKey(task));
    setError(null);
    const result = await removeGoogleTaskAction({ tasklistId: task.tasklistId, taskId: task.id });
    if (result.ok) {
      setHub((current) => current ? { ...current, tasks: current.tasks.filter((candidate) => taskKey(candidate) !== taskKey(task)) } : current);
    } else {
      await handleGoogleFailure(result.error ?? "Could not remove Google Task.");
    }
    setRemoving(null);
  }

  function toggleHidden(task: HubTask) {
    setHidden((current) => {
      const next = new Set(current);
      const key = taskKey(task);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveHidden(next);
      return next;
    });
  }

  return (
    <Card>
      <CardHeader title="Google Tasks" subtitle="Manage every Google task list without turning them all into Year Mission commitments." />
      {!status ? (
        <p className="text-sm text-zinc-500">Checking Google Tasks…</p>
      ) : !status.configured ? (
        <p className="text-sm text-zinc-500">Google Tasks is not configured.</p>
      ) : !status.connected ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-zinc-400">{error ?? "Connect Google to view and manage all of your task lists here."}</p>
          <div><Button size="sm" onClick={connect}>Reconnect Google</Button></div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={sync} disabled={syncing || loadingHub}><RefreshCw className={`h-3.5 w-3.5 ${syncing || loadingHub ? "animate-spin" : ""}`} />{syncing ? "Syncing…" : "Sync"}</Button>
            <Button size="sm" variant="ghost" onClick={disconnect}>Disconnect</Button>
          </div>

          {hub && (
            <>
              <div className="flex gap-2">
                <select value={selectedList} onChange={(event) => setSelectedList(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-xs text-zinc-200">
                  {hub.lists.map((list) => <option key={list.id} value={list.id}>{list.title}</option>)}
                </select>
                <input value={newTask} onChange={(event) => setNewTask(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void addTask(); }} placeholder="Add task" className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-700" />
                <Button size="sm" onClick={addTask} disabled={!selectedList || !newTask.trim() || adding}><Plus className="h-3.5 w-3.5" />{adding ? "Adding…" : "Add"}</Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="relative min-w-0 flex-1"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search all lists" className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-8 pr-3 text-xs text-zinc-200 outline-none focus:border-zinc-700" /></label>
                <Button size="sm" variant="ghost" onClick={() => setShowCompleted((value) => !value)}>{showCompleted ? "Hide completed" : "Show completed"}</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowHidden((value) => !value)}>{showHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}{showHidden ? "Visible" : "Hidden"}</Button>
              </div>

              <div className="flex max-h-96 flex-col divide-y divide-zinc-800/80 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/30">
                {visibleTasks.length === 0 ? <p className="p-3 text-xs text-zinc-600">No matching Google tasks.</p> : visibleTasks.map((task) => (
                  <div key={taskKey(task)} className="flex items-start gap-2 p-3">
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${task.status === "completed" ? "text-zinc-600 line-through" : "text-zinc-200"}`}>{task.title}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-600">{task.tasklistTitle}{formatDue(task.due) ? ` · ${formatDue(task.due)}` : ""}</p>
                    </div>
                    <button type="button" onClick={() => toggleHidden(task)} className="rounded p-1 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300" aria-label={hidden.has(taskKey(task)) ? "Show task" : "Hide task"}>{hidden.has(taskKey(task)) ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}</button>
                    <button type="button" onClick={() => void removeTask(task)} disabled={Boolean(removing)} className="rounded p-1 text-zinc-600 hover:bg-zinc-800 hover:text-red-300 disabled:opacity-40" aria-label="Delete Google task"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {message && <p className="mt-3 text-xs text-emerald-400">{message}</p>}
      {error && status?.connected && <p className="mt-3 text-xs text-amber-300">{error}</p>}
    </Card>
  );
}
