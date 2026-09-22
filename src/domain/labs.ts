import { z } from "zod";

export const labFlagSchema = z.enum(["low", "high", "normal", "abnormal", "unknown"]);

export const labResultDraftSchema = z.object({
  testName: z.string().trim().min(1).max(160),
  loincCode: z.string().trim().max(32).nullable().optional(),
  valueNumeric: z.number().finite().nullable().optional(),
  valueText: z.string().trim().max(120).nullable().optional(),
  unit: z.string().trim().max(80).nullable().optional(),
  referenceLow: z.number().finite().nullable().optional(),
  referenceHigh: z.number().finite().nullable().optional(),
  referenceText: z.string().trim().max(160).nullable().optional(),
  abnormalFlag: labFlagSchema.default("unknown"),
});

export const labScanDraftSchema = z.object({
  collectedAt: z.string().datetime({ offset: true }).nullable().optional(),
  sourceName: z.string().trim().max(160).nullable().optional(),
  interpretation: z.string().trim().max(4000).nullable().optional(),
  results: z.array(labResultDraftSchema).min(1).max(120),
});

export type LabResultDraft = z.infer<typeof labResultDraftSchema>;
export type LabScanDraft = z.infer<typeof labScanDraftSchema>;

export function parseLabScanJson(raw: string): LabScanDraft {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(cleaned) as unknown;
  return labScanDraftSchema.parse(parsed);
}

export function comparableLabKey(result: Pick<LabResultDraft, "testName" | "unit" | "loincCode">): string {
  return `${result.loincCode?.toLowerCase() || result.testName.trim().toLowerCase()}|${result.unit?.trim().toLowerCase() || ""}`;
}
