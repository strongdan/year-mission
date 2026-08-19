"use client";

import { useEffect, useState } from "react";
import { getGoogleSyncStatusAction, connectGoogleTasksAction, syncGoogleTasksAction, disconnectGoogleTasksAction } from "@/app/actions";
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
        <CardHeader title="Google Tasks" subtitle="Two-way sync with Google Tasks." />
        <p className="text-xs text-zinc-500">Not configured on the server.</p>
      </Card>
    );
  }

  if (!status.connected) {
    return (
      <Card>
        <CardHeader title="Google Tasks" subtitle="Two-way sync with Google Tasks." />
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-400">
            Connect Google Tasks to keep your Year Mission tasks visible in the Google Tasks app. Year Mission stays canonical.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={connect}>
              Connect
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
        title="Google Tasks"
        subtitle={status.email ? `Synced as ${status.email}` : "Two-way sync with Google Tasks."}
      />
      <div className="flex flex-col gap-2">
        {message && <p className="text-xs text-emerald-400">{message}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={sync} disabled={syncing}>
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync now"}
          </Button>
          <Button size="sm" variant="ghost" onClick={async () => { await disconnectGoogleTasksAction(); await loadStatus(); }}>
            Disconnect
          </Button>
        </div>
      </div>
    </Card>
  );
}