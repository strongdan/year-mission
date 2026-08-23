"use client";

import { useCallback, useEffect, useState } from "react";
import { Dumbbell, Headphones, Link2, Plus, Trash2 } from "lucide-react";
import {
  getExecutionSettingsAction,
  saveExecutionSettingsAction,
  type ExecutionSettings,
  type HypnosisMediaItem,
} from "@/app/execution-actions";
import { DEFAULT_EQUIPMENT, EQUIPMENT_OPTIONS, type EquipmentId } from "@/domain/execution-protocols";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

const EMPTY: ExecutionSettings = {
  equipment: DEFAULT_EQUIPMENT,
  pumpClubUrl: "",
  audiobookshelfUrl: "",
  hypnosisMedia: [],
};

export function ExecutionSettingsCard() {
  const [settings, setSettings] = useState<ExecutionSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<HypnosisMediaItem["type"]>("audio");

  const load = useCallback(async () => {
    const result = await getExecutionSettingsAction();
    if (result.ok && result.data) setSettings(result.data.settings);
    else setError(result.error ?? "Could not load execution settings.");
    setLoading(false);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void load());
    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  function toggleEquipment(id: EquipmentId) {
    setSettings((current) => ({
      ...current,
      equipment: current.equipment.includes(id) ? current.equipment.filter((item) => item !== id) : [...current.equipment, id],
    }));
  }

  function addMedia() {
    const title = mediaTitle.trim();
    const url = mediaUrl.trim();
    if (!title || !url) return;
    const item: HypnosisMediaItem = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`,
      title,
      url,
      type: mediaType,
    };
    setSettings((current) => ({ ...current, hypnosisMedia: [...current.hypnosisMedia, item] }));
    setMediaTitle("");
    setMediaUrl("");
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    const result = await saveExecutionSettingsAction(settings);
    if (result.ok && result.data) {
      setSettings(result.data);
      setMessage("Execution settings saved. Runners will use these choices immediately.");
    } else setError(result.error ?? "Could not save execution settings.");
    setSaving(false);
  }

  if (loading) return <Card><p className="text-sm text-zinc-500">Loading execution settings…</p></Card>;

  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      <Card>
        <CardHeader title="Execution defaults" subtitle="Remove the setup decisions that usually happen after you tap Start." right={<Dumbbell className="h-4 w-4 text-zinc-500" />} />
        <p className="mb-2 text-xs font-medium text-zinc-500">Equipment normally available</p>
        <div className="grid grid-cols-2 gap-2">
          {EQUIPMENT_OPTIONS.map((option) => <label key={option.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs ${settings.equipment.includes(option.id) ? "border-sky-800 bg-sky-950/20 text-zinc-200" : "border-zinc-800 text-zinc-500"}`}><input type="checkbox" className="accent-sky-500" checked={settings.equipment.includes(option.id)} onChange={() => toggleEquipment(option.id)} /> {option.label}</label>)}
        </div>
        <label className="mt-4 block text-xs text-zinc-500">Pump Club / preferred lifting app link<input value={settings.pumpClubUrl} onChange={(event) => setSettings((current) => ({ ...current, pumpClubUrl: event.target.value }))} placeholder="https://… or app://…" className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-sky-700" /></label>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-700">Leave blank to use the built-in workout runner only.</p>
      </Card>

      <Card>
        <CardHeader title="Hypnosis & audio" subtitle="Year Mission launches media; your finished hypnosis tracks can remain hosted in Audiobookshelf." right={<Headphones className="h-4 w-4 text-zinc-500" />} />
        <label className="block text-xs text-zinc-500">Audiobookshelf URL<input value={settings.audiobookshelfUrl} onChange={(event) => setSettings((current) => ({ ...current, audiobookshelfUrl: event.target.value }))} placeholder="https://audio.example.com" className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-violet-700" /></label>
        <div className="mt-4 border-t border-zinc-800 pt-4">
          <p className="text-xs font-medium text-zinc-400">Saved media</p>
          {settings.hypnosisMedia.length === 0 ? <p className="mt-2 text-xs text-zinc-600">No tracks yet. Add a direct MP3/MP4 URL or an Audiobookshelf item link.</p> : <div className="mt-2 flex flex-col gap-2">{settings.hypnosisMedia.map((item) => <div key={item.id} className="flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2.5"><Link2 className="h-3.5 w-3.5 shrink-0 text-zinc-600" /><div className="min-w-0 flex-1"><p className="truncate text-sm text-zinc-300">{item.title}</p><p className="truncate text-[11px] text-zinc-700">{item.type} · {item.url}</p></div><button onClick={() => setSettings((current) => ({ ...current, hypnosisMedia: current.hypnosisMedia.filter((entry) => entry.id !== item.id) }))} aria-label={`Remove ${item.title}`} className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>}
        </div>
        <div className="mt-4 grid gap-2">
          <input value={mediaTitle} onChange={(event) => setMediaTitle(event.target.value)} placeholder="Track title" className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-violet-700" />
          <input value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} placeholder="MP3/MP4 or item URL" className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-violet-700" />
          <div className="flex gap-2"><select value={mediaType} onChange={(event) => setMediaType(event.target.value as HypnosisMediaItem["type"])} className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-300 outline-none"><option value="audio">MP3 / audio</option><option value="video">MP4 / video</option><option value="external">External player link</option></select><Button size="sm" variant="secondary" onClick={addMedia} disabled={!mediaTitle.trim() || !mediaUrl.trim()}><Plus className="mr-1 h-4 w-4" /> Add</Button></div>
        </div>
      </Card>

      <Button className="w-full" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save execution settings"}</Button>
      {message && <p className="rounded-xl border border-emerald-900/50 bg-emerald-950/15 px-3 py-2 text-sm text-emerald-300">{message}</p>}
      {error && <p className="rounded-xl border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
