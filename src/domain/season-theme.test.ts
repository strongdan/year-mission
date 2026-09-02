import { describe, expect, it } from "vitest";
import { normalizeSeasonThemeKey, seasonTheme } from "./season-theme";

describe("seasonTheme", () => {
  it("maps canonical seasons to distinct themes", () => {
    expect(seasonTheme("Stabilize").accent).toBe("sky");
    expect(seasonTheme("Build").accent).toBe("emerald");
    expect(seasonTheme("Transform").accent).toBe("violet");
    expect(seasonTheme("Convert").accent).toBe("amber");
  });

  it("falls back safely for custom or missing season names", () => {
    expect(normalizeSeasonThemeKey(null)).toBe("year");
    expect(normalizeSeasonThemeKey("Custom season")).toBe("year");
    expect(seasonTheme("Custom season").label).toBe("Year Mission");
  });
});
