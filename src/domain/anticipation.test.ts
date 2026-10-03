import { describe, expect, it } from "vitest";
import { addDays, calendarEventKey, calendarEventLocalDate, daysBetween, nextOccurrence, planningHolidays, planningTaskTitle } from "./anticipation";

describe("anticipation planning", () => {
  it("rolls yearly dates into the next year after they pass", () => {
    expect(nextOccurrence("2020-03-10", "yearly", "2026-09-07")).toBe("2027-03-10");
    expect(nextOccurrence("2020-12-10", "yearly", "2026-09-07")).toBe("2026-12-10");
  });

  it("calculates preparation dates without timezone drift", () => {
    expect(addDays("2026-12-25", -30)).toBe("2026-11-25");
    expect(daysBetween("2026-11-25", "2026-12-25")).toBe(30);
  });

  it("generates planning-oriented holidays deterministically", () => {
    const holidays = planningHolidays(2026);
    expect(holidays.find((item) => item.title === "Easter")?.date).toBe("2026-04-05");
    expect(holidays.find((item) => item.title === "Mother's Day")?.date).toBe("2026-05-10");
    expect(holidays.find((item) => item.title === "Father's Day")?.date).toBe("2026-06-21");
    expect(holidays.find((item) => item.title === "Thanksgiving")?.date).toBe("2026-11-26");
  });

  it("makes birthday planning tasks concrete", () => {
    expect(planningTaskTitle({ kind: "birthday", title: "Alex's birthday", personName: "Alex" })).toBe("Plan Alex's birthday");
    expect(planningTaskTitle({ kind: "birthday", title: "Alex's birthday", personName: null })).toBe("Plan Alex's birthday");
    expect(planningTaskTitle({ kind: "deadline", title: "Tax filing", personName: null })).toBe("Prepare for deadline: Tax filing");
  });
  it("observes Feb 29 yearly dates on Feb 28 in non-leap years", () => {
    expect(nextOccurrence("2024-02-29", "yearly", "2026-01-10")).toBe("2026-02-28");
    expect(nextOccurrence("2024-02-29", "yearly", "2028-01-10")).toBe("2028-02-29");
  });

  it("keeps all-day dates date-only and converts timed events to the viewer's timezone", () => {
    expect(calendarEventLocalDate({ allDay: true, start: "2026-10-01" }, "America/Juneau")).toBe("2026-10-01");
    expect(calendarEventLocalDate({ allDay: false, start: "2026-09-30T23:30:00-10:00" }, "America/Los_Angeles")).toBe("2026-10-01");
  });

  it("keeps recurring event identities stable across reschedules", () => {
    expect(calendarEventKey({ id: "instance-new", recurringEventId: "series-1", originalStart: "2026-10-01T09:00:00-07:00" })).toBe("gcal:series-1:2026-10-01T09:00:00-07:00");
    expect(calendarEventKey({ id: "event-1" })).toBe("gcal:event-1");
  });
  it("does not invent a yearly occurrence before the stored start year", () => {
    expect(nextOccurrence("2027-12-01", "yearly", "2026-09-01")).toBe("2027-12-01");
  });

});
