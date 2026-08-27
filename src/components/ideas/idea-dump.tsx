"use client";

import { useState } from "react";
import { Brain, CheckSquare2, Sparkles, Square } from "lucide-react";
import {
  captureIdeaAction,
  createIdeaTasksAction,
  organizeIdeaAction,
} from "@/app/idea-actions";
import { IdeaAudioCapture } from "@/components/ideas/idea-audio-capture";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import type { Idea } from "@/types/models";
import type { OrganizedIdea } from "@/services/ideas/idea-organizer";

function formatCapturedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function IdeaDump({ initialIdeas }: { initialIdeas: Idea[] }) {
  const [text, setText] = useState("");
  const [ideas, setIdeas] = useState(initialIdeas);
  const [audioBusy, setAudioBusy] = useState(false);
  const [busy, setBusy] = useState<"save" | "save-organize" | "organize" | "tasks" | null>(null);
  const [activeIdeaId, setActiveIdeaId] = useState<string | null>(null);
  const [organized, setOrganized] = useState<OrganizedIdea | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(andOrganize: boolean) {
    if (!text.trim() || busy || audioBusy) return;
    setBusy(andOrganize ? "save-organize" : "save");
    setError(null);
    setMessage(null);
    const result = await captureIdeaAction({ originalText: text });
    if (!result.ok || !result.data) {
      setError(result.error ?? "Could not save the thought.");
      setBusy(null);
      return;
    }

    const idea = result.data as Idea;
    setIdeas((current) => [idea, ...current]);
    setText("");
    setMessage("Captured. The original wording is preserved.");

    if (andOrganize) {
      await organize(idea.id, true);
      return;
    }
    setBusy(null);
  }

  async function organize(ideaId: string, fromSave = false) {
    if (!fromSave && busy) return;
    setBusy("organize");
    setError(null);
    setMessage(null);
    const result = await organizeIdeaAction(ideaId);
    if (!result.ok || !result.data) {
      setError(result.error ?? "Could not organize this thought right now.");
      setBusy(null);
      return;
    }
    setActiveIdeaId(ideaId);
    setOrganized(result.data as OrganizedIdea);
    setSelected(new Set(result.data.tasks.map((_, index) => index)));
    setBusy(null);
  }

  function toggleTask(index: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function createSelectedTasks() {
    if (!activeIdeaId || !organized || selected.size === 0 || busy) return;
    setBusy("tasks");
    setError(null);
    setMessage(null);
    const tasks = organized.tasks.filter((_, index) => selected.has(index));
    const result = await createIdeaTasksAction({ ideaId: activeIdeaId, tasks });
    if (!result.ok) {
      const partial = result.data?.createdCount ? ` ${result.data.createdCount} were created before the error.` : "";
      setError(`${result.error ?? "Could not create the selected to-dos."}${partial}`);
      setBusy(null);
      return;
    }
    setIdeas((current) => current.map((idea) => idea.id === activeIdeaId ? { ...idea, status: "active" } : idea));
    setMessage(`${result.data.createdCount} ${result.data.createdCount === 1 ? "to-do" : "to-dos"} added to Inbox. The original idea was not changed.`);
    setOrganized(null);
    setActiveIdeaId(null);
    setSelected(new Set());
    setBusy(null);
  }

  const captureBusy = Boolean(busy) || audioBusy;

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">Capture without commitment</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Brain dump</h1>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">Type it or narrate it. Save the thought first. AI can suggest to-dos afterward without replacing what you actually said.</p>
      </header>

      <Card className="border-violet-950/70 bg-violet-950/10">
        <CardHeader title="Get it out of your head" subtitle="Messy is fine. Nothing here becomes a commitment until you choose it." right={<Brain className="h-4 w-4 text-violet-400" />} />
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="I keep thinking about…"
          className="min-h-44 w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-3 text-sm leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-zinc-700"
        />
        <IdeaAudioCapture
          disabled={Boolean(busy)}
          onBusyChange={setAudioBusy}
          onTranscript={(transcript) => {
            setText((current) => `${current.trimEnd()}${current.trim() ? "\n\n" : ""}${transcript.trim()}`);
          }}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" onClick={() => void save(false)} disabled={!text.trim() || captureBusy}>{busy === "save" ? "Saving…" : "Save thought"}</Button>
          <Button type="button" variant="secondary" onClick={() => void save(true)} disabled={!text.trim() || captureBusy}>
            <Sparkles className="h-4 w-4" />
            {busy === "save-organize" || busy === "organize" ? "Organizing…" : "Save & organize"}
          </Button>
        </div>
      </Card>

      {organized && activeIdeaId && (
        <Card className="border-emerald-950/70 bg-emerald-950/10">
          <CardHeader title="Possible to-dos" subtitle={organized.summary} right={<Sparkles className="h-4 w-4 text-emerald-400" />} />
          {organized.tasks.length === 0 ? (
            <p className="text-sm text-zinc-400">Nothing here clearly needs to become a task. It can stay an idea.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {organized.tasks.map((task, index) => {
                const checked = selected.has(index);
                return (
                  <button key={`${task.title}-${index}`} type="button" onClick={() => toggleTask(index)} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 text-left transition-colors hover:border-zinc-700">
                    {checked ? <CheckSquare2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <Square className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />}
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-zinc-200">{task.title}</span>
                      <span className="mt-1 block text-[11px] text-zinc-500">{[task.domain, task.estimatedMinutes ? `${task.estimatedMinutes} min` : null, task.dueDate ? `due ${task.dueDate}` : null].filter(Boolean).join(" · ") || "Inbox"}</span>
                    </span>
                  </button>
                );
              })}
              <div className="mt-1 flex gap-2">
                <Button type="button" onClick={createSelectedTasks} disabled={selected.size === 0 || Boolean(busy)}>{busy === "tasks" ? "Creating…" : `Create ${selected.size} selected`}</Button>
                <Button type="button" variant="ghost" onClick={() => { setOrganized(null); setActiveIdeaId(null); setSelected(new Set()); }} disabled={Boolean(busy)}>Keep as idea only</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {message && <p className="text-xs text-emerald-400">{message}</p>}
      {error && <p className="text-xs leading-relaxed text-amber-300">{error}</p>}

      <section className="flex flex-col gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">Recent thoughts</h2>
          <p className="mt-0.5 text-[11px] text-zinc-600">Original captures stay here even after you turn parts of them into tasks.</p>
        </div>
        {ideas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-600">Nothing captured yet.</div>
        ) : ideas.slice(0, 30).map((idea) => (
          <Card key={idea.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-600">{formatCapturedAt(idea.created_at)}{idea.status === "active" ? " · tasks extracted" : ""}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{idea.notes || idea.title}</p>
              </div>
            </div>
            <div className="mt-3">
              <Button type="button" size="sm" variant="ghost" onClick={() => void organize(idea.id)} disabled={Boolean(busy)}>
                <Sparkles className="h-3.5 w-3.5" />
                {busy === "organize" && activeIdeaId === idea.id ? "Organizing…" : "Organize into to-dos"}
              </Button>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
