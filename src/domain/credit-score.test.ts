import { describe, expect, it } from "vitest";
import {
  escapeIlikeLiteral,
  localDateInTimeZone,
  normalizeCreditIdentifier,
  sameCreditSeries,
} from "./credit-score";

describe("credit score identifiers", () => {
  it("normalizes casing and whitespace consistently", () => {
    expect(normalizeCreditIdentifier("  VantageScore   3.0 ")).toBe("vantagescore 3.0");
    expect(normalizeCreditIdentifier(" FICO ")).toBe("fico");
    expect(normalizeCreditIdentifier(" Experian ")).toBe("experian");
  });

  it("escapes ILIKE wildcard characters as literals", () => {
    expect(escapeIlikeLiteral("FICO_8")).toBe("FICO\\_8");
    expect(escapeIlikeLiteral("Model%Test")).toBe("Model\\%Test");
    expect(escapeIlikeLiteral("A\\B")).toBe("A\\\\B");
  });

  it("selects only the same bureau and score-model series", () => {
    expect(sameCreditSeries(
      { bureau: "Experian", scoreModel: "VantageScore 3.0" },
      { bureau: " experian ", scoreModel: "vantagescore   3.0" },
    )).toBe(true);
    expect(sameCreditSeries(
      { bureau: "Experian", scoreModel: "FICO 8" },
      { bureau: "Experian", scoreModel: "VantageScore 3.0" },
    )).toBe(false);
  });
});

describe("credit score local date boundaries", () => {
  it("uses the supplied IANA time zone at the same instant", () => {
    const instant = new Date("2026-09-25T08:30:00.000Z");
    expect(localDateInTimeZone("America/Juneau", instant)).toBe("2026-09-25");
    expect(localDateInTimeZone("Pacific/Honolulu", instant)).toBe("2026-09-24");
    expect(localDateInTimeZone("Asia/Tokyo", instant)).toBe("2026-09-25");
  });

  it("rejects invalid time zones", () => {
    expect(localDateInTimeZone("Not/AZone", new Date("2026-09-25T08:30:00.000Z"))).toBeNull();
  });
});
