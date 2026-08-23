"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellRing, Smartphone } from "lucide-react";
import {
  getNotificationSettingsAction,
  removePushSubscriptionAction,
  saveNotificationPreferencesAction,
  savePushSubscriptionAction,
  testNotificationAction,
} from "@/app/notification-actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

type NotificationStatus = NonNullable<Awaited<ReturnType<typeof getNotificationSettingsAction>>["data"]>;

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export function NotificationSettingsCard() {
  const [status, setStatus] = useState<NotificationStatus | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [supported, setSupported] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [timezone, setTimezone] = useState("UTC");
  const [morningTime, setMorningTime] = useState("08:00");
  const [eveningTime, setEveningTime] = useState("20:30");
  const [morningEnabled, setMorningEnabled] = useState(true);
  const [eveningEnabled, setEveningEnabled] = useState(true);
  const [busy, setBusy] = useState<"enable" | "save" | "test" | "disable" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await getNotificationSettingsAction();
    if (!result.ok || !result.data) {
      setError(result.error ?? "Notification settings could not be loaded.");
      return;
    }
    setStatus(result.data);
    setMorningTime(result.data.preferences.morningTime);
    setEveningTime(result.data.preferences.eveningTime);
    setMorningEnabled(result.data.preferences.morningEnabled);
    setEveningEnabled(result.data.preferences.eveningEnabled);

    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || result.data.preferences.timezone || "UTC";
    setTimezone(detectedTimezone);

    if ("serviceWorker" in navigator && "PushManager" in window) {
      const registration = await navigator.serviceWorker.ready;
      setSubscription(await registration.pushManager.getSubscription());
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const canPush = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
      setSupported(canPush);
      setPermission(canPush ? Notification.permission : "unsupported");
      const mediaStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const navigatorStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
      setStandalone(mediaStandalone || navigatorStandalone);
      void load();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  async function enable() {
    if (!status?.publicKey || !supported || busy) return;
    setBusy("enable");
    setMessage(null);
    setError(null);
    try {
      const requested = await Notification.requestPermission();
      setPermission(requested);
      if (requested !== "granted") {
        setError(requested === "denied" ? "Notifications are blocked for Year Mission in your device settings." : "Notification permission was not granted.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const next = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(status.publicKey),
      });
      const json = next.toJSON();
      const saved = await savePushSubscriptionAction({
        endpoint: next.endpoint,
        expirationTime: next.expirationTime,
        keys: json.keys,
        timezone,
        userAgent: navigator.userAgent,
      });
      if (!saved.ok) {
        setError(saved.error ?? "Could not save this device for notifications.");
        return;
      }
      setSubscription(next);
      setMessage("Reminders enabled on this device.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not enable notifications.");
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (busy) return;
    setBusy("save");
    setMessage(null);
    setError(null);
    const result = await saveNotificationPreferencesAction({
      enabled: Boolean(subscription),
      morningEnabled,
      morningTime,
      eveningEnabled,
      eveningTime,
      timezone,
    });
    if (result.ok) setMessage("Reminder schedule saved.");
    else setError(result.error ?? "Could not save reminder schedule.");
    setBusy(null);
  }

  async function test() {
    if (busy) return;
    setBusy("test");
    setMessage(null);
    setError(null);
    const result = await testNotificationAction();
    if (result.ok) setMessage("Test sent. It should appear as a Year Mission notification.");
    else setError(result.error ?? "Test notification failed.");
    setBusy(null);
  }

  async function disable() {
    if (!subscription || busy) return;
    setBusy("disable");
    setMessage(null);
    setError(null);
    const endpoint = subscription.endpoint;
    try {
      await subscription.unsubscribe();
      const result = await removePushSubscriptionAction(endpoint);
      if (!result.ok) setError(result.error ?? "Could not remove this device.");
      else {
        setSubscription(null);
        setMessage("Reminders disabled on this device.");
      }
    } finally {
      setBusy(null);
    }
  }

  const ready = Boolean(status?.serverConfigured && status?.migrationReady);

  return (
    <div className="px-4 pb-4">
      <Card className="border-amber-950/70 bg-amber-950/10">
        <CardHeader
          title="Check-in reminders"
          subtitle="Two gentle prompts: orient in the morning, close the day in the evening."
          right={subscription ? <BellRing className="h-4 w-4 text-amber-400" /> : <Bell className="h-4 w-4 text-zinc-500" />}
        />

        {!supported && (
          <p className="text-xs leading-relaxed text-zinc-400">This browser does not expose web push notifications.</p>
        )}

        {supported && !standalone && (
          <div className="mb-3 flex gap-2 rounded-xl border border-zinc-800 bg-zinc-950/30 p-3">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
            <p className="text-xs leading-relaxed text-zinc-400">
              On iPhone, add Year Mission to the Home Screen and enable reminders from the installed app for reliable notifications.
            </p>
          </div>
        )}

        {status && !status.migrationReady && (
          <p className="mb-3 text-xs leading-relaxed text-amber-300/80">Notification database migration 0011 still needs to be applied.</p>
        )}
        {status && !status.serverConfigured && (
          <p className="mb-3 text-xs leading-relaxed text-amber-300/80">Web push keys are not configured on the server yet.</p>
        )}

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/25 px-3 py-2.5">
            <div>
              <p className="text-sm text-zinc-300">Morning orientation</p>
              <p className="text-[11px] text-zinc-600">Open → see the next move → start.</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={morningEnabled} onChange={(event) => setMorningEnabled(event.target.checked)} className="h-4 w-4" />
              <input type="time" value={morningTime} onChange={(event) => setMorningTime(event.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200" />
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/25 px-3 py-2.5">
            <div>
              <p className="text-sm text-zinc-300">Evening closeout</p>
              <p className="text-[11px] text-zinc-600">Close the loop in about two minutes.</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={eveningEnabled} onChange={(event) => setEveningEnabled(event.target.checked)} className="h-4 w-4" />
              <input type="time" value={eveningTime} onChange={(event) => setEveningTime(event.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200" />
            </div>
          </div>

          <p className="text-[11px] text-zinc-600">Time zone: {timezone}. Reminders are intentionally limited to these two check-ins.</p>

          <div className="flex flex-wrap gap-2">
            {!subscription ? (
              <Button size="sm" onClick={enable} disabled={!ready || !supported || busy !== null}>
                {busy === "enable" ? "Enabling…" : permission === "denied" ? "Notifications blocked" : "Enable reminders"}
              </Button>
            ) : (
              <>
                <Button size="sm" onClick={save} disabled={busy !== null}>{busy === "save" ? "Saving…" : "Save schedule"}</Button>
                <Button size="sm" variant="secondary" onClick={test} disabled={busy !== null}>{busy === "test" ? "Sending…" : "Send test"}</Button>
                <Button size="sm" variant="ghost" onClick={disable} disabled={busy !== null}>{busy === "disable" ? "Disabling…" : "Disable"}</Button>
              </>
            )}
          </div>

          {message && <p className="text-xs text-emerald-400">{message}</p>}
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </Card>
    </div>
  );
}
