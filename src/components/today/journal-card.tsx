"use client";

import { useEffect, useState } from "react";
import { BookOpen, Sparkles, Trash2 } from "lucide-react";
import {
  analyzeJournalEntryAction,
  deleteJournalEntryAction,
  listJournalEntriesAction,
  promoteJournalSuggestionAction,
  saveJournalEntryAction,
  type JournalEntryView,
} from "@/app/journal-actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

function createdLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function JournalCard() {
  const [body, setBody] = useState("");
  const [entries, setEntries] = useState<JournalEntryView[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void listJournalEntriesAction(3).then((result) => {
      if (!active) return;
      if (result.ok) setEntries(result.data);
      else setError(result.error);
    });
    return () => { active = false; };
  }, []);

  function replaceEntry(entry: JournalEntryView) {
    setEntries((current) => [entry, ...current.filter((item) => item.id !== entry.id)].slice(0, 3));
  }

  async function save(analyze: boolean) {
    const text = body.trim();
    if (!text || busy) return;
    setBusy("save");
    setMessage(null);
    setError(null);

    const saved = await saveJournalEntryAction(text);
    if (!saved.ok) {
      setError(saved.error);
      setBusy(null);
      return;
    }

    replaceEntry(saved.data);
    setBody("");
    setMessage("Journal entry saved.");

    if (analyze) {
      setBusy(saved.data.id);
      const analyzed = await analyzeJournalEntryAction(saved.data.id);
      if (analyzed.ok) {
        replaceEntry(analyzed.data);
        setMessage("Journal entry saved and analyzed.");
      } else {
        setError(analyzed.error);
      }
    }
    setBusy(null);
  }

  async function analyze(entryId: string) {
    if (busy) return;
    setBusy(entryId);
    setMessage(null);
    setError(null);
    const result = await analyzeJournalEntryAction(entryId);
    if (result.ok) {
      replaceEntry(result.data);
      setMessage("Analysis updated.");
    } else {
      setError(result.error);
    }
    setBusy(null);
  }

  async function promote(entryId: string) {
    if (busy) return;
    setBusy(`promote:${entryId}`);
    setMessage(null);
    setError(null);
    const result = await promoteJournalSuggestionAction(entryId);
    if (result.ok) {
      setEntries((current) => current.map((entry) => entry.id === entryId
        ? { ...entry, promotedTaskId: result.data.taskId }
        : entry));
      setMessage(result.data.alreadyPromoted ? "That action is already in your tasks." : "Suggested action added to Inbox.");
    } else {
      setError(result.error);
    }
    setBusy(null);
  }

  async function remove(entryId: string) {
    if (busy) return;
    setBusy(`delete:${entryId}`);
    setMessage(null);
    setError(null);
    const result = await deleteJournalEntryAction(entryId);
    if (result.ok) {
      setEntries((current) => current.filter((entry) => entry.id !== entryId));
      setMessage("Journal entry deleted.");
    } else {
      setError(result.error);
    }
    setBusy(null);
  }

  return (
    <div className="px-4 pb-4">
      <Card>
        <CardHeader
          title="Quick reflection"
          subtitle="Write what is on your mind. AI analysis is optional and never changes your plan by itself."
          right={<BookOpen className="h-4 w-4 text-zinc-500" />}
        />

        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          maxLength={12_000}
          placeholder="What happened, what feels stuck, or what do you want to remember?"
          className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-700"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => void save(false)} disabled={!body.trim() || busy !== null}>
            {busy === "save" ? "Saving…" : "Save"}
          </Button>
          <Button size="sm" onClick={() => void save(true)} disabled={!body.trim() || busy !== null}>
            <Sparkles className="h-3.5 w-3.5" />
            Save & analyze
          </Button>
        </div>

        {entries.length > 0 && (
          <div className="mt-4 divide-y divide-zinc-800/80 border-t border-zinc-800/80">
            {entries.map((entry) => (
              <article key={entry.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{entry.body}</p>
                    <p className="mt-1 text-[11px] text-zinc-600">{createdLabel(entry.createdAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void remove(entry.id)}
                    disabled={busy !== null}
                    aria-label="Delete journal entry"
                    className="shrink-0 rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-900 hover:text-zinc-300 disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {entry.aiAnalysis ? (
                  <div className="mt-3 rounded-xl border border-violet-950/70 bg-violet-950/10 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-400">AI reflection</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-300">{entry.aiAnalysis}</p>
                    {entry.aiProvider && <p className="mt-2 text-[10px] text-zinc-600">{entry.aiProvider}{entry.aiModel ? ` · ${entry.aiModel}` : ""}</p>}
                  </div>
                ) : (
                  <Button className="mt-2" size="sm" variant="ghost" onClick={() => void analyze(entry.id)} disabled={busy !== null}>
                    <Sparkles className="h-3.5 w-3.5" />
                    {busy === entry.id ? "Analyzing…" : "Analyze"}
                  </Button>
                )}

                {entry.suggestedAction && (
                  <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-950/30 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Possible next action</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-300">{entry.suggestedAction}</p>
                    {entry.promotedTaskId ? (
                      <p className="mt-2 text-[11px] text-emerald-400">Added to Inbox</p>
                    ) : (
                      <Button className="mt-2" size="sm" variant="secondary" onClick={() => void promote(entry.id)} disabled={busy !== null}>
                        {busy === `promote:${entry.id}` ? "Adding…" : "Add to Inbox"}
                      </Button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {message && <p className="mt-3 text-xs text-emerald-400">{message}</p>}
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      </Card>
    </div>
  );
}
