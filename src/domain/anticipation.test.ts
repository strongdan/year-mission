import { describe, expect, it } from "vitest";
import { addDays, daysBetween, nextOccurrence, planningHolidays, planningTaskTitle } from "./anticipation";

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
    expect(planningTaskTitle({ kind: "deadline", title: "Tax filing", personName: null })).toBe("Prepare for deadline: Tax filing");
  });
});
