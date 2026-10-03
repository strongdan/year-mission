import { describe, expect, it } from "vitest";
import { addDaysToDateOnly, dateInTimeZone, isValidDateOnly, localDateInTimeZone, mondayOfDateOnly, validTimeZone } from "./local-calendar";

describe("local calendar context", () => {
  it("validates date-only values without using a UTC date prefix as a local date", () => {
    expect(isValidDateOnly("2026-02-28")).toBe(true);
    expect(isValidDateOnly("2026-02-29")).toBe(false);
  });

  it("anchors week boundaries and month rollover to the supplied local day", () => {
    expect(mondayOfDateOnly("2026-09-27")).toBe("2026-09-21");
    expect(mondayOfDateOnly("2026-09-28")).toBe("2026-09-28");
    expect(addDaysToDateOnly("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDaysToDateOnly("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("converts timestamped events using the user timezone", () => {
    const timestamp = "2026-09-26T02:30:00.000Z";
    expect(dateInTimeZone(timestamp, "America/Juneau")).toBe("2026-09-25");
    expect(dateInTimeZone(timestamp, "America/New_York")).toBe("2026-09-25");
    expect(localDateInTimeZone(new Date("2026-09-26T07:30:00.000Z"), "America/Juneau")).toBe("2026-09-25");
  });

  it("falls back safely for an invalid timezone", () => {
    expect(validTimeZone("Not/AZone")).toBe("UTC");
    expect(validTimeZone("America/Juneau")).toBe("America/Juneau");
  });
});
