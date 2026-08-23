"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ExternalLink, Headphones, ShieldCheck } from "lucide-react";
import { getExecutionSettingsAction, logExecutionAction, type ExecutionSettings, type HypnosisMediaItem } from "@/app/execution-actions";
import { DEFAULT_EQUIPMENT } from "@/domain/execution-protocols";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function HypnosisPlayer({ taskId, onComplete }: { taskId?: string | null; onComplete?: () => void }) {
  const [settings, setSettings] = useState<ExecutionSettings>({ equipment: DEFAULT_EQUIPMENT, pumpClubUrl: "", audiobookshelfUrl: "", hypnosisMedia: [] });
  const [selected, setSelected] = useState<HypnosisMediaItem | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [listeningStarted, setListeningStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    getExecutionSettingsAction().then((result) => {
      if (!result.ok || !result.data) return;
      setSettings(result.data.settings);
      if (result.data.settings.hypnosisMedia[0]) setSelected(result.data.settings.hypnosisMedia[0]);
    });
  }, []);

  function beginListening() {
    if (startedAt.current === null) startedAt.current = Date.now();
    setListeningStarted(true);
  }

  async function finishSession() {
    if (saving || finished) return;
    setSaving(true);
    const startTime = startedAt.current;
    const durationSeconds = startTime === null ? 30 : Math.max(30, Math.round((Date.now() - startTime) / 1000));
    const result = await logExecutionAction({
      protocolId: selected?.id ? `hypnosis-${selected.id}` : "hypnosis-external",
      kind: "hypnosis",
      durationSeconds,
      taskId: taskId ?? null,
      details: { title: selected?.title ?? "Audiobookshelf", mediaType: selected?.type ?? "external" },
    });
    if (!result.ok) {
      setError(result.error ?? "Could not save hypnosis session.");
      setSaving(false);
      return;
    }
    setFinished(true);
    setSaving(false);
    onComplete?.();
  }

  if (finished) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950 text-emerald-300"><Check className="h-7 w-7" /></div>
        <div><h1 className="text-2xl font-semibold text-zinc-100">Session complete</h1><p className="mt-1 text-sm text-zinc-500">Listening recorded. You can stop here.</p></div>
        {!onComplete && <Link href="/"><Button>Back to Today</Button></Link>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      {!onComplete && <Link href="/execute" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200"><ArrowLeft className="h-3.5 w-3.5" /> Routines</Link>}
      <header className="flex items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold text-zinc-100">Hypnosis</h1><p className="mt-1 text-xs text-zinc-500">Play a saved MP3/MP4 or open your private Audiobookshelf library.</p></div><Headphones className="mt-1 h-5 w-5 text-violet-400" /></header>

      <Card className="border-amber-900/40 bg-amber-950/10">
        <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" /><div><p className="text-sm font-medium text-zinc-200">Safe listening only</p><p className="mt-1 text-xs leading-relaxed text-zinc-500">Use hypnosis only while seated or lying down somewhere safe. Not while driving, operating machinery, supervising hazards, or doing anything requiring full attention. You remain in control and can stop at any time.</p><label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="h-4 w-4 accent-amber-500" /> I am somewhere safe to listen.</label></div></div>
      </Card>

      {settings.hypnosisMedia.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {settings.hypnosisMedia.map((item) => <button key={item.id} onClick={() => { setSelected(item); startedAt.current = null; setListeningStarted(false); }} className={`min-w-[150px] rounded-xl border px-3 py-2.5 text-left ${selected?.id === item.id ? "border-violet-700 bg-violet-950/25" : "border-zinc-800 bg-zinc-900/20"}`}><p className="truncate text-sm text-zinc-200">{item.title}</p><p className="mt-0.5 text-[11px] uppercase tracking-wide text-zinc-600">{item.type}</p></button>)}
        </div>
      )}

      {selected ? (
        <Card className="border-violet-900/50 bg-violet-950/10">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-violet-400/80">Selected track</p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-100">{selected.title}</h2>
          {!acknowledged && <p className="mt-3 text-xs text-amber-300">Confirm safe listening above to enable playback.</p>}
          {acknowledged && selected.type === "audio" && <audio className="mt-4 w-full" controls preload="metadata" src={selected.url} onPlay={beginListening} onEnded={() => void finishSession()} />}
          {acknowledged && selected.type === "video" && <video className="mt-4 aspect-video w-full rounded-xl bg-black" controls preload="metadata" src={selected.url} onPlay={beginListening} onEnded={() => void finishSession()} />}
          {selected.type === "external" && <a href={acknowledged ? selected.url : undefined} onClick={(event) => { if (!acknowledged) { event.preventDefault(); return; } beginListening(); }} target="_blank" rel="noreferrer" className={`mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium ${acknowledged ? "bg-zinc-100 text-zinc-950" : "cursor-not-allowed bg-zinc-800 text-zinc-600"}`}>Open track <ExternalLink className="h-4 w-4" /></a>}
          <div className="mt-4 border-t border-zinc-800 pt-3"><Button size="sm" variant="secondary" onClick={() => void finishSession()} disabled={saving || !listeningStarted}>{saving ? "Saving…" : "End session"}</Button></div>
        </Card>
      ) : (
        <Card><p className="text-sm text-zinc-300">No direct media tracks are saved yet.</p><p className="mt-1 text-xs leading-relaxed text-zinc-500">Add an MP3/MP4 URL or an Audiobookshelf item link in Settings. The audio stays hosted where it already lives.</p><Link href="/settings" className="mt-3 inline-block text-sm text-sky-400 hover:text-sky-300">Configure hypnosis media</Link></Card>
      )}

      {settings.audiobookshelfUrl && (
        <a href={acknowledged ? settings.audiobookshelfUrl : undefined} onClick={(event) => { if (!acknowledged) { event.preventDefault(); return; } beginListening(); }} target="_blank" rel="noreferrer" className={`flex items-center justify-between rounded-xl border px-3 py-3 text-sm ${acknowledged ? "border-zinc-800 text-zinc-300 hover:border-zinc-700" : "cursor-not-allowed border-zinc-900 text-zinc-700"}`}><span>Personal Hypnosis library</span><span className="inline-flex items-center gap-1.5">Open Audiobookshelf <ExternalLink className="h-3.5 w-3.5" /></span></a>
      )}

      {listeningStarted && <Button variant="secondary" onClick={() => void finishSession()} disabled={saving}>{saving ? "Saving…" : "Mark listening complete"}</Button>}
      {error && <p className="rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
