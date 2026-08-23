import { NextResponse } from "next/server";
import { createAdminClient } from "@/integrations/supabase/server";
import { localClock, reminderWindowsDue } from "@/domain/notification-schedule";
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

    const { morningDue, eveningDue } = reminderWindowsDue(preference, clock);
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
      const sentPatch: { last_morning_sent_on?: string; last_evening_sent_on?: string } = {};
      if (morningDue) sentPatch.last_morning_sent_on = clock.date;
      if (eveningDue) sentPatch.last_evening_sent_on = clock.date;
      await admin.from("notification_preferences").update(sentPatch).eq("user_id", preference.user_id);
    }
  }

  return NextResponse.json({ ok: true, sent, expired });
}
