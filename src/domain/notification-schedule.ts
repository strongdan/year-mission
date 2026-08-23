export interface NotificationClock {
  date: string;
  hour: number;
  minute: number;
}

export interface ReminderPreference {
  morning_enabled: boolean;
  morning_time: string;
  evening_enabled: boolean;
  evening_time: string;
  last_morning_sent_on: string | null;
  last_evening_sent_on: string | null;
}

export function localClock(now: Date, timeZone: string): NotificationClock {
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

export function dueWithinWindow(target: string, hour: number, minute: number, windowMinutes = 20): boolean {
  const match = /^(\d{2}):(\d{2})/.exec(target);
  if (!match || windowMinutes <= 0) return false;
  const targetHour = Number(match[1]);
  const targetMinute = Number(match[2]);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    targetHour < 0 ||
    targetHour > 23 ||
    targetMinute < 0 ||
    targetMinute > 59 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return false;
  }
  const delta = hour * 60 + minute - (targetHour * 60 + targetMinute);
  return delta >= 0 && delta < windowMinutes;
}

export function reminderWindowsDue(preference: ReminderPreference, clock: NotificationClock) {
  return {
    morningDue:
      preference.morning_enabled &&
      preference.last_morning_sent_on !== clock.date &&
      dueWithinWindow(preference.morning_time, clock.hour, clock.minute),
    eveningDue:
      preference.evening_enabled &&
      preference.last_evening_sent_on !== clock.date &&
      dueWithinWindow(preference.evening_time, clock.hour, clock.minute),
  };
}
