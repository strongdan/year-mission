import { describe, expect, it } from "vitest";
import { comparableLabKey, parseLabScanJson } from "./labs";

describe("lab parsing", () => {
  it("parses fenced structured lab JSON", () => {
    const parsed = parseLabScanJson(`\`\`\`json
{"collectedAt":"2026-09-06T08:00:00-08:00","sourceName":"Example Lab","interpretation":"LDL is flagged high on the report.","results":[{"testName":"LDL Cholesterol","loincCode":"13457-7","valueNumeric":142,"valueText":null,"unit":"mg/dL","referenceLow":null,"referenceHigh":129,"referenceText":"<130","abnormalFlag":"high"}]}
\`\`\``);

    expect(parsed.results[0]?.testName).toBe("LDL Cholesterol");
    expect(parsed.results[0]?.valueNumeric).toBe(142);
    expect(parsed.results[0]?.abnormalFlag).toBe("high");
  });

  it("rejects unknown abnormal flags", () => {
    expect(() => parseLabScanJson(JSON.stringify({
      results: [{ testName: "Glucose", valueNumeric: 90, abnormalFlag: "probably fine" }],
    }))).toThrow();
  });

  it("compares labs by LOINC and unit when available", () => {
    expect(comparableLabKey({ testName: "LDL", loincCode: "13457-7", unit: "mg/dL" }))
      .toBe("13457-7|mg/dl");
  });
});
