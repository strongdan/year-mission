import { describe, expect, it } from "vitest";
import { escapeIlikeLiteral, normalizeCreditIdentifier } from "./credit-score";

describe("credit score identifiers", () => {
  it("normalizes casing and whitespace for client comparisons", () => {
    expect(normalizeCreditIdentifier("  VantageScore   3.0 ")).toBe("vantagescore 3.0");
    expect(normalizeCreditIdentifier(" Experian ")).toBe("experian");
  });

  it("escapes ILIKE wildcard characters as literals", () => {
    expect(escapeIlikeLiteral("FICO_8")).toBe("FICO\\_8");
    expect(escapeIlikeLiteral("Model%Test")).toBe("Model\\%Test");
    expect(escapeIlikeLiteral("A\\B")).toBe("A\\\\B");
  });
});
