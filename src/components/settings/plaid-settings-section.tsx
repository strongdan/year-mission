"use client";

import { useCallback, useEffect, useState } from "react";
import { Landmark, RefreshCw, ShieldCheck } from "lucide-react";
import {
  createPlaidLinkTokenAction,
  createPlaidReconnectTokenAction,
  deletePlaidImportedDataAction,
  disconnectPlaidAction,
  exchangePlaidPublicTokenAction,
  getFinanceStatusAction,
  syncPlaidAction,
} from "@/app/finance-actions";
import { Button } from "@/components/ui/button";

interface PlaidConnection {
  id: string;
  itemId: string;
  displayName: string | null;
  status: "active" | "reconnect_required" | "disconnected" | "error";
  lastSyncedAt: string | null;
  lastErrorCode: string | null;
  consentExpiresAt: string | null;
}

interface PlaidStatus {
  configured: boolean;
  environment: "sandbox" | "production";
  connections: PlaidConnection[];
}

type LinkMode = "new" | "reconnect";

interface StoredLinkSession {
  token: string;
  mode: LinkMode;
  connectionId: string | null;
}

interface PlaidLinkMetadata {
  institution?: { name?: string | null } | null;
}

interface PlaidLinkError {
  error_code?: string | null;
  error_message?: string | null;
}

interface PlaidHandler {
  open(): void;
  destroy(): void;
}

interface PlaidStatic {
  create(options: {
    token: string;
    receivedRedirectUri?: string;
    onSuccess(publicToken: string | null, metadata: PlaidLinkMetadata): void;
    onExit(error: PlaidLinkError | null): void;
  }): PlaidHandler;
}

declare global {
  interface Window {
    Plaid?: PlaidStatic;
  }
}

const PLAID_SCRIPT_SRC = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
const PLAID_SESSION_KEY = "year-mission-plaid-link-session";
let plaidScriptPromise: Promise<void> | null = null;

function loadPlaidScript(): Promise<void> {
  if (window.Plaid) return Promise.resolve();
  if (plaidScriptPromise) return plaidScriptPromise;

  plaidScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PLAID_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Plaid Link could not be loaded.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = PLAID_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Plaid Link could not be loaded."));
    document.head.appendChild(script);
  });

  return plaidScriptPromise;
}

function lastSync(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function clearOAuthQuery() {
  const url = new URL(window.location.href);
  url.searchParams.delete("oauth_state_id");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function readStoredSession(): StoredLinkSession | null {
  try {
    const raw = localStorage.getItem(PLAID_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredLinkSession;
    if (!parsed.token || (parsed.mode !== "new" && parsed.mode !== "reconnect")) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function PlaidSettingsSection() {
  const [status, setStatus] = useState<PlaidStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    const result = await getFinanceStatusAction();
    if (result.ok && result.data?.plaid) {
      setStatus(result.data.plaid as PlaidStatus);
    } else {
      setError(result.error ?? "Plaid status could not be loaded.");
    }
  }, []);

  const finishSession = useCallback(async (
    session: StoredLinkSession,
    publicToken: string | null,
    metadata: PlaidLinkMetadata
  ) => {
    if (session.mode === "new") {
      if (!publicToken) throw new Error("Plaid completed without a public token.");
      const result = await exchangePlaidPublicTokenAction({
        publicToken,
        institutionName: metadata.institution?.name ?? null,
      });
      if (!result.ok) throw new Error(result.error ?? "Plaid token exchange failed.");
      setMessage("Bank connected and read-only finance data synced.");
    } else {
      if (!session.connectionId) throw new Error("Plaid reconnect session is missing its connection ID.");
      const result = await syncPlaidAction(session.connectionId);
      if (!result.ok) throw new Error(result.error ?? "Plaid reconnection completed, but sync failed.");
      setMessage("Bank authorization refreshed and finance data synced.");
    }
    localStorage.removeItem(PLAID_SESSION_KEY);
    clearOAuthQuery();
    await refreshStatus();
  }, [refreshStatus]);

  const openLink = useCallback(async (
    session: StoredLinkSession,
    receivedRedirectUri?: string
  ) => {
    await loadPlaidScript();
    if (!window.Plaid) throw new Error("Plaid Link is unavailable.");

    const handler = window.Plaid.create({
      token: session.token,
      ...(receivedRedirectUri ? { receivedRedirectUri } : {}),
      onSuccess(publicToken, metadata) {
        setBusy("finishing");
        setError(null);
        void finishSession(session, publicToken, metadata)
          .catch((cause) => setError(cause instanceof Error ? cause.message : "Plaid connection could not be completed."))
          .finally(() => {
            setBusy(null);
            handler.destroy();
          });
      },
      onExit(linkError) {
        if (linkError) {
          setError(linkError.error_message || linkError.error_code || "Plaid Link closed with an error.");
        }
        if (!window.location.search.includes("oauth_state_id=")) {
          localStorage.removeItem(PLAID_SESSION_KEY);
        }
        setBusy(null);
        handler.destroy();
      },
    });

    handler.open();
  }, [finishSession]);

  useEffect(() => {
    void refreshStatus();

    if (!window.location.search.includes("oauth_state_id=")) return;
    const session = readStoredSession();
    if (!session) {
      setError("Plaid returned from bank authorization, but the Link session could not be restored. Start Connect bank again.");
      clearOAuthQuery();
      return;
    }

    setBusy("oauth");
    void openLink(session, window.location.href).catch((cause) => {
      setBusy(null);
      setError(cause instanceof Error ? cause.message : "Plaid OAuth could not be resumed.");
    });
  }, [openLink, refreshStatus]);

  async function startNewConnection() {
    if (busy) return;
    setBusy("new");
    setMessage(null);
    setError(null);
    const result = await createPlaidLinkTokenAction();
    if (!result.ok || !result.data?.linkToken) {
      setBusy(null);
      setError(result.error ?? "Plaid Link could not be started.");
      return;
    }
    const session: StoredLinkSession = { token: result.data.linkToken, mode: "new", connectionId: null };
    localStorage.setItem(PLAID_SESSION_KEY, JSON.stringify(session));
    try {
      await openLink(session);
    } catch (cause) {
      localStorage.removeItem(PLAID_SESSION_KEY);
      setBusy(null);
      setError(cause instanceof Error ? cause.message : "Plaid Link could not be opened.");
    }
  }

  async function reconnect(connectionId: string) {
    if (busy) return;
    setBusy(`reconnect:${connectionId}`);
    setMessage(null);
    setError(null);
    const result = await createPlaidReconnectTokenAction(connectionId);
    if (!result.ok || !result.data?.linkToken) {
      setBusy(null);
      setError(result.error ?? "Plaid reconnection could not be started.");
      return;
    }
    const session: StoredLinkSession = { token: result.data.linkToken, mode: "reconnect", connectionId };
    localStorage.setItem(PLAID_SESSION_KEY, JSON.stringify(session));
    try {
      await openLink(session);
    } catch (cause) {
      localStorage.removeItem(PLAID_SESSION_KEY);
      setBusy(null);
      setError(cause instanceof Error ? cause.message : "Plaid Link could not be opened.");
    }
  }

  async function sync(connectionId?: string) {
    if (busy) return;
    setBusy(connectionId ? `sync:${connectionId}` : "sync-all");
    setMessage(null);
    setError(null);
    const result = await syncPlaidAction(connectionId);
    if (result.ok) {
      setMessage(connectionId ? "Bank data refreshed." : "All active bank connections refreshed.");
      await refreshStatus();
    } else {
      setError(result.error ?? "Plaid sync failed.");
      await refreshStatus();
    }
    setBusy(null);
  }

  async function disconnect(connectionId: string) {
    if (busy) return;
    setBusy(`disconnect:${connectionId}`);
    setMessage(null);
    setError(null);
    const result = await disconnectPlaidAction(connectionId);
    if (result.ok) {
      setMessage("Bank disconnected. Previously imported finance history was kept.");
      await refreshStatus();
    } else {
      setError(result.error ?? "Bank could not be disconnected.");
    }
    setBusy(null);
  }

  async function deleteImportedData() {
    if (busy || !window.confirm("Delete all finance accounts, transactions, and liabilities imported through Plaid? This does not affect your bank.")) return;
    setBusy("delete-data");
    setMessage(null);
    setError(null);
    const result = await deletePlaidImportedDataAction();
    if (result.ok) {
      setMessage("Imported Plaid finance data deleted.");
      await refreshStatus();
    } else {
      setError(result.error ?? "Plaid data could not be deleted.");
    }
    setBusy(null);
  }

  const connections = status?.connections ?? [];

  return (
    <section className="rounded-xl border border-emerald-950/60 bg-emerald-950/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-emerald-400" />
            <p className="text-sm font-semibold text-zinc-200">Plaid bank connection</p>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">Preferred read-only bank/card connection. Year Mission requests Transactions and optional Liabilities; it cannot move money.</p>
        </div>
        <span className={`shrink-0 text-[11px] ${status?.configured ? "text-emerald-400" : "text-zinc-600"}`}>
          {status?.configured ? status.environment : "Not configured"}
        </span>
      </div>

      {status?.configured ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void startNewConnection()} disabled={busy !== null}>
              {busy === "new" ? "Opening…" : "Connect bank"}
            </Button>
            {connections.some((connection) => connection.status === "active") && (
              <Button size="sm" variant="secondary" onClick={() => void sync()} disabled={busy !== null}>
                <RefreshCw className={`h-3.5 w-3.5 ${busy === "sync-all" ? "animate-spin" : ""}`} />
                {busy === "sync-all" ? "Syncing…" : "Sync all"}
              </Button>
            )}
          </div>

          {connections.length > 0 && (
            <div className="mt-3 divide-y divide-zinc-800/80 rounded-xl border border-zinc-800 bg-zinc-950/20 px-3">
              {connections.map((connection) => (
                <div key={connection.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-zinc-300">{connection.displayName || "Connected institution"}</p>
                      <p className="mt-0.5 text-[10px] text-zinc-600">Last sync: {lastSync(connection.lastSyncedAt)}</p>
                      {connection.lastErrorCode && <p className="mt-0.5 text-[10px] text-amber-400/80">{connection.lastErrorCode}</p>}
                    </div>
                    <span className={`text-[10px] ${connection.status === "active" ? "text-emerald-400" : connection.status === "reconnect_required" ? "text-amber-400" : "text-zinc-500"}`}>
                      {connection.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {connection.status === "active" ? (
                      <Button size="sm" variant="secondary" onClick={() => void sync(connection.id)} disabled={busy !== null}>
                        {busy === `sync:${connection.id}` ? "Syncing…" : "Sync"}
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => void reconnect(connection.id)} disabled={busy !== null}>
                        {busy === `reconnect:${connection.id}` ? "Opening…" : "Reconnect"}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => void disconnect(connection.id)} disabled={busy !== null}>
                      {busy === `disconnect:${connection.id}` ? "Disconnecting…" : "Disconnect"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <details className="mt-3 text-[11px] text-zinc-500">
            <summary className="cursor-pointer">Privacy & removal</summary>
            <div className="mt-2 flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/20 p-3">
              <div className="flex items-start gap-2 leading-relaxed"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />Permanent Plaid access tokens are encrypted server-side and are not readable by the browser or normal user database queries.</div>
              <p>Disconnecting revokes the Plaid Item but keeps imported history. You can separately delete all Plaid-imported finance data.</p>
              <div><Button size="sm" variant="ghost" onClick={() => void deleteImportedData()} disabled={busy !== null}>{busy === "delete-data" ? "Deleting…" : "Delete imported Plaid data"}</Button></div>
            </div>
          </details>
        </>
      ) : (
        <p className="mt-3 text-xs leading-relaxed text-amber-300/80">Add Plaid server credentials and a permitted redirect URI to enable real bank linking. Existing SimpleFIN, Actual, and manual finance paths remain available below.</p>
      )}

      {message && <p className="mt-3 text-xs text-emerald-400">{message}</p>}
      {error && <p className="mt-3 text-xs leading-relaxed text-amber-300">{error}</p>}
    </section>
  );
}
