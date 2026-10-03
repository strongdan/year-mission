import { describe, expect, it } from "vitest";
import { addDays, daysOverdue, isReminderDue, nextDateAfterCompletion, rescheduleDate } from "./actionable-reminders";

describe("actionable reminder policy", () => {
  it("treats today and past dates as due", () => {
    expect(isReminderDue("2026-09-07", "2026-09-07")).toBe(true);
    expect(isReminderDue("2026-09-01", "2026-09-07")).toBe(true);
    expect(isReminderDue("2026-09-08", "2026-09-07")).toBe(false);
  });

  it("reschedules by the configured deliberate delay", () => {
    expect(rescheduleDate({ default_reschedule_days: 7 }, "2026-09-07")).toBe("2026-09-14");
  });

  it("rolls recurring reminders forward from a late completion", () => {
    expect(nextDateAfterCompletion({ next_due_date: "2026-09-01", recurrence_days: 42, default_reschedule_days: 7 }, "2026-09-07"))
      .toBe("2026-10-19");
  });

  it("deactivates one-time reminders after completion", () => {
    expect(nextDateAfterCompletion({ next_due_date: "2026-09-07", recurrence_days: null, default_reschedule_days: 7 }, "2026-09-07"))
      .toBeNull();
  });

  it("handles month boundaries deterministically", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(daysOverdue("2026-09-01", "2026-09-07")).toBe(6);
  });
});
