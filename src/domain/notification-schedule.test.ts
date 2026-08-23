import { describe, expect, it } from "vitest";
import { dueWithinWindow, localClock, reminderWindowsDue } from "./notification-schedule";

describe("notification scheduling", () => {
  it("accepts the configured time and the following 19 minutes only", () => {
    expect(dueWithinWindow("08:00:00", 8, 0)).toBe(true);
    expect(dueWithinWindow("08:00:00", 8, 19)).toBe(true);
    expect(dueWithinWindow("08:00:00", 8, 20)).toBe(false);
    expect(dueWithinWindow("08:00:00", 7, 59)).toBe(false);
  });

  it("rejects malformed clock values instead of treating them as due", () => {
    expect(dueWithinWindow("not-a-time", 8, 0)).toBe(false);
    expect(dueWithinWindow("25:00", 8, 0)).toBe(false);
    expect(dueWithinWindow("08:75", 8, 0)).toBe(false);
    expect(dueWithinWindow("08:00", 24, 0)).toBe(false);
    expect(dueWithinWindow("08:00", 8, 60)).toBe(false);
  });

  it("uses the preference timezone rather than the server timezone", () => {
    const instant = new Date("2026-08-23T16:30:00.000Z");
    expect(localClock(instant, "America/Juneau")).toEqual({ date: "2026-08-23", hour: 8, minute: 30 });
    expect(localClock(instant, "America/New_York")).toEqual({ date: "2026-08-23", hour: 12, minute: 30 });
  });

  it("does not resend a reminder already recorded for the local date", () => {
    const clock = { date: "2026-08-23", hour: 8, minute: 5 };
    const due = reminderWindowsDue(
      {
        morning_enabled: true,
        morning_time: "08:00:00",
        evening_enabled: true,
        evening_time: "20:30:00",
        last_morning_sent_on: "2026-08-23",
        last_evening_sent_on: null,
      },
      clock
    );
    expect(due).toEqual({ morningDue: false, eveningDue: false });
  });

  it("allows independent morning and evening reminders", () => {
    const base = {
      morning_enabled: true,
      morning_time: "08:00:00",
      evening_enabled: true,
      evening_time: "20:30:00",
      last_morning_sent_on: null,
      last_evening_sent_on: null,
    };
    expect(reminderWindowsDue(base, { date: "2026-08-23", hour: 8, minute: 5 })).toEqual({ morningDue: true, eveningDue: false });
    expect(reminderWindowsDue(base, { date: "2026-08-23", hour: 20, minute: 35 })).toEqual({ morningDue: false, eveningDue: true });
  });
});
