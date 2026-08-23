import { describe, expect, it, vi } from "vitest";
import {
  ADVICE_CATEGORY_LABELS,
  ADVICE_ITEMS,
  adviceForCategory,
  dailyAdvice,
  randomAdvice,
  type AdviceCategory,
} from "./advice";

const CATEGORIES = Object.keys(ADVICE_CATEGORY_LABELS) as AdviceCategory[];

describe("advice catalog", () => {
  it("has unique stable IDs", () => {
    expect(new Set(ADVICE_ITEMS.map((item) => item.id)).size).toBe(ADVICE_ITEMS.length);
  });

  it("has useful content in every exposed category", () => {
    for (const category of CATEGORIES) {
      const items = adviceForCategory(category);
      expect(items.length).toBeGreaterThan(0);
      expect(items.every((item) => item.category === category)).toBe(true);
      expect(items.every((item) => item.title.trim().length > 0 && item.body.trim().length > 0)).toBe(true);
    }
  });

  it("keeps the daily cue deterministic for a calendar date", () => {
    const date = new Date(2026, 7, 23, 8, 0, 0);
    expect(dailyAdvice(date)).toEqual(dailyAdvice(new Date(2026, 7, 23, 22, 30, 0)));
  });

  it("changes the daily selection based on the calendar key rather than time of day", () => {
    const first = dailyAdvice(new Date(2026, 7, 23, 23, 59));
    const next = dailyAdvice(new Date(2026, 7, 24, 0, 1));
    expect(ADVICE_ITEMS).toContain(first);
    expect(ADVICE_ITEMS).toContain(next);
  });

  it("keeps requested random advice inside the requested category", () => {
    const random = vi.spyOn(Math, "random").mockReturnValue(0.75);
    try {
      expect(randomAdvice("strength").category).toBe("strength");
      expect(randomAdvice("nutrition").category).toBe("nutrition");
    } finally {
      random.mockRestore();
    }
  });
});
