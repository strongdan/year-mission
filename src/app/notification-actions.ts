"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createServerClientForApp } from "@/integrations/supabase/server";
import { isWebPushConfigured, sendEmptyWebPush } from "@/services/notifications/web-push";

const TIME_Z = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const SUBSCRIPTION_Z = z.object({
  endpoint: z.string().url().max(4096),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().max(1024).optional(),
    auth: z.string().max(1024).optional(),
  }).optional(),
  timezone: z.string().min(1).max(120),
  userAgent: z.string().max(500).optional(),
});

const PREFERENCES_Z = z.object({
  enabled: z.boolean(),
  morningEnabled: z.boolean(),
  morningTime: TIME_Z,
  eveningEnabled: z.boolean(),
  eveningTime: TIME_Z,
  timezone: z.string().min(1).max(120),
});

function tableMissing(error: { code?: string; message?: string } | null | undefined): boolean {
  return error?.code === "42P01" || Boolean(error?.message?.includes("notification_preferences"));
}

function normalizeTime(value: string | null | undefined, fallback: string): string {
  return value ? value.slice(0, 5) : fallback;
}

export async function getNotificationSettingsAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };

  const supabase = await createServerClientForApp();
  if (!supabase) return { ok: false as const, error: "Database is not configured." };

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("enabled,morning_enabled,morning_time,evening_enabled,evening_time,timezone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error && !tableMissing(error)) return { ok: false as const, error: error.message };

  const { count } = error
    ? { count: 0 }
    : await supabase
        .from("push_subscriptions")
        .select("id", { head: true, count: "exact" })
        .eq("user_id", user.id);

  return {
    ok: true as const,
    data: {
      serverConfigured: isWebPushConfigured(),
      migrationReady: !error,
      publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null,
      subscriptionCount: count ?? 0,
      preferences: {
        enabled: data?.enabled ?? false,
        morningEnabled: data?.morning_enabled ?? true,
        morningTime: normalizeTime(data?.morning_time, "08:00"),
        eveningEnabled: data?.evening_enabled ?? true,
        eveningTime: normalizeTime(data?.evening_time, "20:30"),
        timezone: data?.timezone ?? "UTC",
      },
    },
  };
}

export async function savePushSubscriptionAction(input: unknown) {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  const parsed = SUBSCRIPTION_Z.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid push subscription." };
  if (!isWebPushConfigured()) return { ok: false as const, error: "Web push is not configured on the server." };

  const supabase = await createServerClientForApp();
  if (!supabase) return { ok: false as const, error: "Database is not configured." };
  const value = parsed.data;

  const { error: subscriptionError } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: value.endpoint,
      expiration_time: value.expirationTime ? Math.round(value.expirationTime) : null,
      p256dh: value.keys?.p256dh ?? null,
      auth: value.keys?.auth ?? null,
      user_agent: value.userAgent ?? null,
    },
    { onConflict: "endpoint" }
  );
  if (subscriptionError) return { ok: false as const, error: subscriptionError.message };

  const { error: preferencesError } = await supabase.from("notification_preferences").upsert({
    user_id: user.id,
    enabled: true,
    timezone: value.timezone,
  });
  if (preferencesError) return { ok: false as const, error: preferencesError.message };

  return { ok: true as const };
}

export async function saveNotificationPreferencesAction(input: unknown) {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  const parsed = PREFERENCES_Z.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the reminder times and time zone." };

  const supabase = await createServerClientForApp();
  if (!supabase) return { ok: false as const, error: "Database is not configured." };
  const value = parsed.data;
  const { error } = await supabase.from("notification_preferences").upsert({
    user_id: user.id,
    enabled: value.enabled,
    morning_enabled: value.morningEnabled,
    morning_time: value.morningTime,
    evening_enabled: value.eveningEnabled,
    evening_time: value.eveningTime,
    timezone: value.timezone,
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function removePushSubscriptionAction(endpoint: string) {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  const supabase = await createServerClientForApp();
  if (!supabase) return { ok: false as const, error: "Database is not configured." };

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);
  if (error) return { ok: false as const, error: error.message };
  await supabase.from("notification_preferences").update({ enabled: false }).eq("user_id", user.id);
  return { ok: true as const };
}

export async function testNotificationAction() {
  const { user } = await requireUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  if (!isWebPushConfigured()) return { ok: false as const, error: "Web push is not configured on the server." };
  const supabase = await createServerClientForApp();
  if (!supabase) return { ok: false as const, error: "Database is not configured." };

  const { data, error } = await supabase.from("push_subscriptions").select("id,endpoint").eq("user_id", user.id);
  if (error) return { ok: false as const, error: error.message };
  if (!data?.length) return { ok: false as const, error: "Enable notifications on this device first." };

  let delivered = 0;
  for (const subscription of data) {
    try {
      const result = await sendEmptyWebPush(subscription.endpoint);
      if (result.ok) delivered += 1;
      if (result.expired) await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
    } catch {
      // Try remaining devices. The user receives a useful aggregate result below.
    }
  }

  return delivered > 0
    ? { ok: true as const, data: { delivered } }
    : { ok: false as const, error: "The push service did not accept the test notification." };
}
