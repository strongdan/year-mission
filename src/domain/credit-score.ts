export interface CreditSeriesIdentity {
  bureau: string;
  scoreModel: string;
}

export interface CreditSnapshotDate {
  measured_at: string;
}

export function normalizeCreditIdentifier(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function escapeIlikeLiteral(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export function sameCreditSeries(a: CreditSeriesIdentity, b: CreditSeriesIdentity): boolean {
  return normalizeCreditIdentifier(a.bureau) === normalizeCreditIdentifier(b.bureau)
    && normalizeCreditIdentifier(a.scoreModel) === normalizeCreditIdentifier(b.scoreModel);
}

/**
 * Applied migrations preserve old casing/whitespace variants instead of deleting
 * history. Treat the newest row for a measurement date as that date's logical
 * snapshot when calculating deltas and best scores.
 */
export function latestSnapshotPerMeasurementDate<T extends CreditSnapshotDate>(snapshots: T[]): T[] {
  const dates = new Set<string>();
  return snapshots.filter((snapshot) => {
    if (dates.has(snapshot.measured_at)) return false;
    dates.add(snapshot.measured_at);
    return true;
  });
}

export function localDateInTimeZone(timeZone: string, now = new Date()): string | null {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}`;
  } catch {
    return null;
  }
}
