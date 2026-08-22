import { describe, it, expect } from "vitest";
import { getEveningResetForWeekday, getEveningResetForDate } from "./evening-reset";

describe("evening-reset", () => {
  it("maps Mon/Wed/Fri to Down-Regulation", () => {
    for (const d of [1, 3, 5]) {
      expect(getEveningResetForWeekday(d).name).toBe("Down-Regulation");
      expect(getEveningResetForWeekday(d).sequence).toBeDefined();
    }
  });

  it("maps Tuesday to Lower Body Reset with focus areas", () => {
    const v = getEveningResetForWeekday(2);
    expect(v.name).toBe("Lower Body Reset");
    expect(v.focus).toContain("hip flexors");
  });

  it("maps Thursday to Upper Body + Spine", () => {
    const v = getEveningResetForWeekday(4);
    expect(v.name).toBe("Upper Body + Spine");
    expect(v.focus).toContain("thoracic rotation");
  });

  it("maps Saturday to Yoga Flow", () => {
    const v = getEveningResetForWeekday(6);
    expect(v.name).toBe("Yoga Flow");
    expect(v.characteristics).toContain("gentle");
  });

  it("maps Sunday to Restore", () => {
    const v = getEveningResetForWeekday(0);
    expect(v.name).toBe("Restore");
    expect(v.characteristics).toContain("restorative");
  });

  it("all variants expose target and floor durations", () => {
    for (let i = 0; i < 7; i++) {
      const v = getEveningResetForWeekday(i);
      expect(v.targetDuration).toBeTruthy();
      expect(v.floorDuration).toBe("5 minutes");
    }
  });

  it("getEveningResetForDate delegates to weekday", () => {
    // 2026-08-17 is a Monday
    const monday = new Date("2026-08-17T12:00:00Z");
    expect(getEveningResetForDate(monday).name).toBe("Down-Regulation");
    const sunday = new Date("2026-08-16T12:00:00Z");
    expect(getEveningResetForDate(sunday).name).toBe("Restore");
  });

  it("throws on invalid weekday", () => {
    expect(() => getEveningResetForWeekday(7)).toThrow();
    expect(() => getEveningResetForWeekday(-1)).toThrow();
  });
});
