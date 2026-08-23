"use client";

import { useEffect, useState } from "react";
import {
  getGoogleSyncStatusAction,
  connectGoogleTasksAction,
  syncGoogleTasksAction,
  disconnectGoogleTasksAction,
} from "@/app/actions";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface Status {
  configured: boolean;
  connected: boolean;
  email: string | null;
  lastSyncedAt: string | null;
}

export function GoogleTasksCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getGoogleSyncStatusAction();
      if (cancelled || !res.ok || !res.data) return;
      setStatus(res.data);
      if (res.data.connected) {
        setSyncing(true);
        const syncRes = await syncGoogleTasksAction();
        if (cancelled) return;
        setSyncing(false);
        if (syncRes.ok && syncRes.data?.summary) {
          const s = syncRes.data.summary;
          setMessage(`${s.pulled} pulled · ${s.pushed} pushed · ${s.updated} updated${s.conflicts ? ` · ${s.conflicts} conflicts` : ""}`);
        } else {
          setError(syncRes.error ?? "Sync failed.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function connect() {
    setError(null);
    const res = await connectGoogleTasksAction();
    if (res.ok && res.data?.url) {
      window.location.href = res.data.url;
    } else {
      setError(res.error ?? "Failed to connect.");
    }
  }

  async function sync() {
    if (syncing) return;
    setSyncing(true);
    setMessage(null);
    setError(null);
    const res = await syncGoogleTasksAction();
    setSyncing(false);
    if (res.ok && res.data?.summary) {
      const s = res.data.summary;
      setMessage(`${s.pulled} pulled · ${s.pushed} pushed · ${s.updated} updated${s.conflicts ? ` · ${s.conflicts} conflicts` : ""}`);
    } else {
      setError(res.error ?? "Sync failed.");
    }
  }

  async function loadStatus() {
    const res = await getGoogleSyncStatusAction();
    if (res.ok && res.data) setStatus(res.data);
  }

  if (!status?.configured) {
    return (
      <Card>
        <CardHeader title="Google" subtitle="Tasks sync + read-only weekly Calendar context." />
        <p className="text-xs text-zinc-500">Not configured on the server.</p>
      </Card>
    );
  }

  if (!status.connected) {
    return (
      <Card>
        <CardHeader title="Google" subtitle="Tasks sync + read-only weekly Calendar context." />
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-400">
            Connect once to keep Year Mission tasks visible in Google Tasks and show your primary Calendar on Today. Year Mission remains canonical for tasks.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={connect}>
              Connect Google
            </Button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Google"
        subtitle={status.email ? `Connected as ${status.email}` : "Tasks sync + read-only weekly Calendar context."}
      />
      <div className="flex flex-col gap-2">
        {message && <p className="text-xs text-emerald-400">{message}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Tasks sync two ways. Calendar is read-only and is used only to give the weekly plan scheduling context.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={sync} disabled={syncing}>
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync tasks"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              await disconnectGoogleTasksAction();
              await loadStatus();
            }}
          >
            Disconnect
          </Button>
        </div>
      </div>
    </Card>
  );
}
