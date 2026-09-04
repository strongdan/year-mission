"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Cloud,
  Database,
  KeyRound,
  RefreshCw,
  Smartphone,
  UserRound,
} from "lucide-react";
import {
  connectGoogleTasksAction,
  disconnectGoogleTasksAction,
  getGoogleSyncStatusAction,
  syncGoogleTasksAction,
} from "@/app/actions";
import { getCalendarWeekAction } from "@/app/calendar-actions";
import {
  getAiStatusAction,
  removeAiApiKeyAction,
  saveAiApiKeyAction,
  selectAiProviderAction,
} from "@/app/ai-status-actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

type UserAiProvider = "gemini" | "openrouter" | "groq" | "openai";
const AI_PROVIDERS: readonly UserAiProvider[] = ["gemini", "openrouter", "groq", "openai"];

const AI_PROVIDER_META: Record<UserAiProvider, { label: string; description: string }> = {
  gemini: { label: "Gemini", description: "Google Gemini free-tier path for routine Coach work." },
  openrouter: { label: "OpenRouter", description: "Uses OpenRouter's free model router and can rotate as free models change." },
  groq: { label: "Groq", description: "Fast, very-low-cost GPT-OSS models with metered usage." },
  openai: { label: "OpenAI", description: "Paid fallback for Coach and task parsing when configured." },
};

interface GoogleStatus {
  configured: boolean;
  connected: boolean;
  email: string | null;
  lastSyncedAt: string | null;
}

interface CalendarStatus {
  outcome: "not_configured" | "not_connected" | "error" | "ok";
  needsReconnect: boolean;
  error?: string;
}

interface AiStatus {
  provider: string;
  model: string;
  mock: boolean;
  freeTier: boolean;
  storageAvailable: boolean;
  stored: {
    preferred: UserAiProvider | null;
    gemini: { configured: boolean; hint: string | null };
    openrouter: { configured: boolean; hint: string | null };
    groq: { configured: boolean; hint: string | null };
    openai: { configured: boolean; hint: string | null };
  };
  fallbackOrder: UserAiProvider[];
  environment: Record<UserAiProvider, boolean>;
}

type Tone = "ready" | "warning" | "muted";

function StatusRow({ label, value, tone = "muted" }: { label: string; value: string; tone?: Tone }) {
  const Icon = tone === "ready" ? CheckCircle2 : tone === "warning" ? CircleAlert : Cloud;
  const color = tone === "ready" ? "text-emerald-400" : tone === "warning" ? "text-amber-400" : "text-zinc-500";

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-zinc-300">{label}</span>
      <span className={`inline-flex items-center gap-1.5 text-xs ${color}`}>
        <Icon className="h-3.5 w-3.5" />
        {value}
      </span>
    </div>
  );
}

function formatLastSync(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function providerLabel(provider: UserAiProvider): string {
  return AI_PROVIDER_META[provider].label;
}

export function SettingsView({ environment, buildSha }: { environment: string; buildSha: string }) {
  const [google, setGoogle] = useState<GoogleStatus | null>(null);
  const [calendar, setCalendar] = useState<CalendarStatus | null>(null);
  const [ai, setAi] = useState<AiStatus | null>(null);
  const [apiInputs, setApiInputs] = useState<Record<UserAiProvider, string>>({ gemini: "", openrouter: "", groq: "", openai: "" });
  const [apiBusy, setApiBusy] = useState<UserAiProvider | null>(null);
  const [timezone, setTimezone] = useState<string>("");
  const [standalone, setStandalone] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"connect" | "sync" | "disconnect" | "refresh" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStatuses = useCallback(async () => {
    setError(null);
    const [googleRes, calendarRes, aiRes] = await Promise.all([
      getGoogleSyncStatusAction(),
      getCalendarWeekAction(),
      getAiStatusAction(),
    ]);

    if (googleRes.ok && googleRes.data) setGoogle(googleRes.data);
    else setError(googleRes.error ?? "Google status could not be loaded.");

    if (calendarRes.ok && calendarRes.data) setCalendar(calendarRes.data);
    else setError((current) => current ?? calendarRes.error ?? "Calendar status could not be loaded.");

    if (aiRes.ok && aiRes.data) setAi(aiRes.data as AiStatus);
    else setError((current) => current ?? aiRes.error ?? "AI status could not be loaded.");

    setLoading(false);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "Device local time");
      const mediaStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const navigatorStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
      setStandalone(mediaStandalone || navigatorStandalone);
      void loadStatuses();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loadStatuses]);

  async function connectGoogle() {
    if (busy) return;
    setBusy("connect");
    setMessage(null);
    setError(null);
    const result = await connectGoogleTasksAction();
    if (result.ok && result.data?.url) {
      window.location.href = result.data.url;
      return;
    }
    setBusy(null);
    setError(result.error ?? "Could not start Google authorization.");
  }

  async function syncGoogle() {
    if (busy) return;
    setBusy("sync");
    setMessage(null);
    setError(null);
    const result = await syncGoogleTasksAction();
    if (result.ok && result.data?.summary) {
      const summary = result.data.summary;
      setMessage(`Google Tasks synced: ${summary.pulled} pulled · ${summary.pushed} pushed · ${summary.updated} updated${summary.conflicts ? ` · ${summary.conflicts} conflicts` : ""}`);
      await loadStatuses();
    } else {
      setError(result.error ?? "Google Tasks sync failed.");
    }
    setBusy(null);
  }

  async function disconnectGoogle() {
    if (busy) return;
    setBusy("disconnect");
    setMessage(null);
    setError(null);
    const result = await disconnectGoogleTasksAction();
    if (!result.ok) setError(result.error ?? "Could not disconnect Google.");
    else setMessage("Google disconnected.");
    await loadStatuses();
    setBusy(null);
  }

  async function refresh() {
    if (busy) return;
    setBusy("refresh");
    setMessage(null);
    await loadStatuses();
    setBusy(null);
  }

  async function saveApiKey(provider: UserAiProvider) {
    const apiKey = apiInputs[provider].trim();
    if (!apiKey || apiBusy) return;
    setApiBusy(provider);
    setMessage(null);
    setError(null);
    const result = await saveAiApiKeyAction({ provider, apiKey });
    if (result.ok && result.data) {
      setAi(result.data as AiStatus);
      setApiInputs((current) => ({ ...current, [provider]: "" }));
      setMessage(`${providerLabel(provider)} connected and selected as the first Coach provider.`);
    } else {
      setError(result.error ?? "Could not save API key.");
    }
    setApiBusy(null);
  }

  async function removeApiKey(provider: UserAiProvider) {
    if (apiBusy) return;
    setApiBusy(provider);
    setMessage(null);
    setError(null);
    const result = await removeAiApiKeyAction(provider);
    if (result.ok && result.data) {
      setAi(result.data as AiStatus);
      setMessage(`${providerLabel(provider)} key removed from this device.`);
    } else {
      setError(result.error ?? "Could not remove API key.");
    }
    setApiBusy(null);
  }

  async function selectApiProvider(provider: UserAiProvider) {
    if (apiBusy) return;
    setApiBusy(provider);
    setMessage(null);
    setError(null);
    const result = await selectAiProviderAction(provider);
    if (result.ok && result.data) {
      setAi(result.data as AiStatus);
      setMessage(`${providerLabel(provider)} selected as the first Coach provider; configured fallbacks remain available.`);
    } else {
      setError(result.error ?? "Could not select provider.");
    }
    setApiBusy(null);
  }

  const tasksTone: Tone = google?.connected ? "ready" : google?.configured ? "warning" : "muted";
  const tasksLabel = google?.connected ? "Connected" : google?.configured ? "Connect" : "Not configured";

  const calendarTone: Tone = calendar?.outcome === "ok" ? "ready" : calendar?.needsReconnect || calendar?.outcome === "error" ? "warning" : "muted";
  const calendarLabel = calendar?.outcome === "ok" ? "Read only" : calendar?.needsReconnect ? "Reconnect required" : calendar?.outcome === "not_connected" ? "Not connected" : calendar?.outcome === "not_configured" ? "Not configured" : calendar?.outcome === "error" ? "Unavailable" : "Checking";

  const aiTone: Tone = ai && !ai.mock ? "ready" : ai?.mock ? "warning" : "muted";
  const aiLabel = ai ? (ai.mock ? "Mock coach" : ai.provider) : "Checking";

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">Year Mission</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Settings</h1>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">Connect services, add API access, and control app behavior. Mission planning stays elsewhere.</p>
      </header>

      <Card className="border-sky-950/70 bg-sky-950/10">
        <CardHeader title="System status" subtitle="A quick check that the pieces needed for daily use are available." right={<button onClick={refresh} disabled={busy !== null} aria-label="Refresh status" className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40"><RefreshCw className={`h-4 w-4 ${busy === "refresh" ? "animate-spin" : ""}`} /></button>} />
        <div className="divide-y divide-zinc-800/80">
          <StatusRow label="Account" value="Signed in" tone="ready" />
          <StatusRow label="Database" value="Available" tone="ready" />
          <StatusRow label="Google Tasks" value={loading ? "Checking" : tasksLabel} tone={loading ? "muted" : tasksTone} />
          <StatusRow label="Google Calendar" value={loading ? "Checking" : calendarLabel} tone={loading ? "muted" : calendarTone} />
          <StatusRow label="Coach AI" value={loading ? "Checking" : aiLabel} tone={loading ? "muted" : aiTone} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Account" subtitle="Sign in with Apple or Google through Supabase Auth." right={<UserRound className="h-4 w-4 text-zinc-500" />} />
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-sm font-medium text-zinc-200">Signed in</p><p className="mt-0.5 text-xs text-zinc-500">Supabase session is active.</p></div>
          <form action="/auth/signout" method="post"><Button type="submit" size="sm" variant="secondary">Sign out</Button></form>
        </div>
      </Card>

      <Card>
        <CardHeader title="Google services" subtitle="Connect once for Google Tasks and read-only Calendar context." right={<CalendarDays className="h-4 w-4 text-sky-400" />} />
        <div className="flex flex-col gap-3">
          {google?.email && <p className="text-xs text-zinc-400">Connected account: {google.email}</p>}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 px-3">
            <StatusRow label="Tasks permission" value={tasksLabel} tone={tasksTone} />
            <StatusRow label="Calendar permission" value={calendarLabel} tone={calendarTone} />
            <div className="flex items-center justify-between gap-3 py-2"><span className="text-sm text-zinc-300">Last task sync</span><span className="text-xs text-zinc-500">{formatLastSync(google?.lastSyncedAt ?? null)}</span></div>
          </div>
          {!google?.connected ? (
            <div><Button size="sm" onClick={connectGoogle} disabled={busy !== null || google?.configured === false}>{busy === "connect" ? "Connecting…" : "Connect Google"}</Button></div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {calendar?.needsReconnect && <Button size="sm" onClick={connectGoogle} disabled={busy !== null}>{busy === "connect" ? "Connecting…" : "Reconnect Google"}</Button>}
              <Button size="sm" variant="secondary" onClick={syncGoogle} disabled={busy !== null}><RefreshCw className={`h-3.5 w-3.5 ${busy === "sync" ? "animate-spin" : ""}`} />{busy === "sync" ? "Syncing…" : "Sync Tasks"}</Button>
              <Button size="sm" variant="ghost" onClick={disconnectGoogle} disabled={busy !== null}>{busy === "disconnect" ? "Disconnecting…" : "Disconnect"}</Button>
            </div>
          )}
          {calendar?.error && calendar.outcome !== "ok" && <p className="text-xs leading-relaxed text-amber-300/80">{calendar.error}</p>}
        </div>
      </Card>

      <Card>
        <CardHeader title="AI services & fallback" subtitle="Zero- and low-cost providers are tried before paid OpenAI unless you choose another first provider." right={<KeyRound className="h-4 w-4 text-violet-400" />} />
        {ai ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 px-3">
              <div className="flex items-center justify-between gap-3 py-2"><span className="text-sm text-zinc-300">First Coach provider</span><span className={`text-xs ${ai.mock ? "text-amber-400" : "text-emerald-400"}`}>{ai.mock ? "Built-in mock" : ai.provider}</span></div>
              <div className="flex items-center justify-between gap-3 border-t border-zinc-800/80 py-2"><span className="text-sm text-zinc-300">Coach model</span><span className="max-w-[180px] truncate text-xs text-zinc-500">{ai.model}</span></div>
              <div className="flex items-start justify-between gap-3 border-t border-zinc-800/80 py-2"><span className="text-sm text-zinc-300">Fallback order</span><span className="max-w-[220px] text-right text-xs leading-relaxed text-zinc-500">{ai.fallbackOrder.length ? ai.fallbackOrder.map(providerLabel).join(" → ") : "No live providers"}</span></div>
            </div>

            {AI_PROVIDERS.map((provider) => {
              const meta = AI_PROVIDER_META[provider];
              const stored = ai.stored[provider];
              const active = ai.provider === provider && !ai.mock;
              return (
                <div key={provider} className={`rounded-xl border p-3 ${active ? "border-violet-800/70 bg-violet-950/10" : "border-zinc-800 bg-zinc-950/20"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-sm font-semibold text-zinc-200">{meta.label}</p><p className="mt-0.5 text-[11px] text-zinc-500">{meta.description}</p></div>
                    <span className={`text-[11px] ${stored.configured ? "text-emerald-400" : ai.environment[provider] ? "text-sky-400" : "text-zinc-600"}`}>{stored.configured ? `Connected ${stored.hint ?? ""}` : ai.environment[provider] ? "Server key" : "Not connected"}</span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input type="password" autoComplete="off" value={apiInputs[provider]} onChange={(event) => setApiInputs((current) => ({ ...current, [provider]: event.target.value }))} placeholder={stored.configured ? "Paste replacement API key…" : "Paste API key…"} className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-500" />
                    <Button size="sm" onClick={() => saveApiKey(provider)} disabled={apiBusy !== null || !apiInputs[provider].trim()}>{apiBusy === provider ? "Testing…" : stored.configured ? "Replace" : "Save & test"}</Button>
                  </div>

                  {stored.configured && (
                    <div className="mt-2 flex gap-2">
                      {!active && <Button size="sm" variant="secondary" onClick={() => selectApiProvider(provider)} disabled={apiBusy !== null}>Try first</Button>}
                      <Button size="sm" variant="ghost" onClick={() => removeApiKey(provider)} disabled={apiBusy !== null}>Remove key</Button>
                    </div>
                  )}
                </div>
              );
            })}

            {!ai.storageAvailable && <p className="text-xs leading-relaxed text-amber-300/80">Secure key storage needs a server encryption key before API keys can be saved here.</p>}
            <p className="text-[11px] leading-relaxed text-zinc-600">Keys entered here are tested server-side, encrypted, and kept in an HttpOnly cookie. The app never displays the saved key again. Deployment-level provider keys remain eligible as fallbacks.</p>
            {ai.freeTier && !ai.mock && <p className="text-xs leading-relaxed text-emerald-400/80">The active first provider has a configured zero-cost path. Provider limits still apply.</p>}
          </div>
        ) : <p className="text-sm text-zinc-500">Checking Coach configuration…</p>}
      </Card>

      <Card>
        <CardHeader title="App preferences" subtitle="Keep these boring and predictable." right={<Smartphone className="h-4 w-4 text-zinc-500" />} />
        <div className="divide-y divide-zinc-800/80">
          <div className="flex items-center justify-between gap-3 py-2"><span className="text-sm text-zinc-300">Time zone</span><span className="max-w-[190px] truncate text-xs text-zinc-500">{timezone || "Detecting…"}</span></div>
          <div className="flex items-center justify-between gap-3 py-2"><span className="text-sm text-zinc-300">Week starts</span><span className="text-xs text-zinc-500">Monday</span></div>
          <div className="flex items-center justify-between gap-3 py-2"><span className="text-sm text-zinc-300">Calendar behavior</span><span className="text-xs text-zinc-500">Read only</span></div>
          <div className="flex items-center justify-between gap-3 py-2"><span className="text-sm text-zinc-300">Notifications</span><span className="text-xs text-zinc-500">Configured separately</span></div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Diagnostics" subtitle="Useful when something stops behaving normally." right={<Database className="h-4 w-4 text-zinc-500" />} />
        <div className="divide-y divide-zinc-800/80">
          <div className="flex items-center justify-between gap-3 py-2"><span className="text-sm text-zinc-300">Environment</span><span className="text-xs capitalize text-zinc-500">{environment}</span></div>
          <div className="flex items-center justify-between gap-3 py-2"><span className="text-sm text-zinc-300">Build</span><span className="font-mono text-xs text-zinc-500">{buildSha}</span></div>
          <div className="flex items-center justify-between gap-3 py-2"><span className="text-sm text-zinc-300">Launch mode</span><span className="text-xs text-zinc-500">{standalone === null ? "Detecting…" : standalone ? "Installed PWA" : "Browser"}</span></div>
          <div className="flex items-center justify-between gap-3 py-2"><span className="text-sm text-zinc-300">Canonical data</span><span className="text-xs text-zinc-500">Supabase</span></div>
        </div>
      </Card>

      {message && <p className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-300">{message}</p>}
      {error && <p className="rounded-xl border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
