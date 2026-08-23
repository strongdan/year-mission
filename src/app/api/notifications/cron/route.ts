import { NextResponse } from "next/server";
import { createAdminClient } from "@/integrations/supabase/server";
import { isWebPushConfigured, sendEmptyWebPush } from "@/services/notifications/web-push";

interface PreferenceRow {
  user_id: string;
  morning_enabled: boolean;
  morning_time: string;
  evening_enabled: boolean;
  evening_time: string;
  timezone: string;
  last_morning_sent_on: string | null;
  last_evening_sent_on: string | null;
}

function localClock(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

function dueWithinWindow(target: string, hour: number, minute: number): boolean {
  const [targetHour, targetMinute] = target.slice(0, 5).split(":").map(Number);
  const delta = hour * 60 + minute - (targetHour * 60 + targetMinute);
  return delta >= 0 && delta < 20;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isWebPushConfigured()) {
    return NextResponse.json({ ok: false, error: "Web push is not configured." }, { status: 503 });
  }

  const admin = await createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, error: "Database admin access is not configured." }, { status: 503 });

  const { data, error } = await admin
    .from("notification_preferences")
    .select("user_id,morning_enabled,morning_time,evening_enabled,evening_time,timezone,last_morning_sent_on,last_evening_sent_on")
    .eq("enabled", true);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const now = new Date();
  let sent = 0;
  let expired = 0;

  for (const preference of (data ?? []) as PreferenceRow[]) {
    let clock: ReturnType<typeof localClock>;
    try {
      clock = localClock(now, preference.timezone);
    } catch {
      continue;
    }

    const morningDue =
      preference.morning_enabled &&
      preference.last_morning_sent_on !== clock.date &&
      dueWithinWindow(preference.morning_time, clock.hour, clock.minute);
    const eveningDue =
      preference.evening_enabled &&
      preference.last_evening_sent_on !== clock.date &&
      dueWithinWindow(preference.evening_time, clock.hour, clock.minute);

    if (!morningDue && !eveningDue) continue;

    const { data: subscriptions } = await admin
      .from("push_subscriptions")
      .select("id,endpoint")
      .eq("user_id", preference.user_id);

    let accepted = 0;
    for (const subscription of subscriptions ?? []) {
      try {
        const result = await sendEmptyWebPush(subscription.endpoint);
        if (result.ok) {
          sent += 1;
          accepted += 1;
        }
        if (result.expired) {
          expired += 1;
          await admin.from("push_subscriptions").delete().eq("id", subscription.id);
        }
      } catch {
        // A single push service failure should not prevent reminders for other devices/users.
      }
    }

    if (accepted > 0) {
      await admin
        .from("notification_preferences")
        .update(morningDue ? { last_morning_sent_on: clock.date } : { last_evening_sent_on: clock.date })
        .eq("user_id", preference.user_id);
    }
  }

  return NextResponse.json({ ok: true, sent, expired });
}
